import * as fs from "fs";
import * as path from "path";
import { Buffer } from "buffer";

import { Torrent } from "../torrent";
import Queue from "./queue";
import Handlers from "./handlers";
import Message from "../message";
import Pieces from "./pieces";
import { createTCPConnection } from "../socket";

import { Peer, Payload, TCPSocket } from "../types";
import { createLogger } from "../logger";

const log = createLogger("Download");

class Download extends Handlers {
  private socket: TCPSocket;
  private torrent: Torrent;
  private message: Message;
  private pieces: Pieces;
  private target: number;
  private queue: Queue;

  constructor(torrent: Torrent) {
    super();
    this.message = new Message();
    this.torrent = torrent;
  }
  
  public async setTargetFolder(folderName: string): Promise<void> { 
    const targetPath = path.resolve(
      __dirname,
      folderName,
      this.torrent.getInfo().name.toString(),
    );

    this.target = fs.openSync(`${targetPath}.zip`, "w");
  }
  
  public async pull(peer: Peer): Promise<void> {
    const { ip, port } = peer; 
    this.socket = createTCPConnection(ip, port);

    this.createConnection();

    this.queue = new Queue(this.torrent);
    this.pieces = new Pieces(this.torrent);

    this.onWholeMessage(async (message) => {
      log("Get all message", message);
      await this.messageHandler(message);
    });
  }

  private async messageHandler(message: Buffer): Promise<void> {
    log("Parsing Message");
    if (this.message.isHandshake(message)) {
      log("is handshake message");

      await this.socket.write(this.message.setInterested());
    } else {
      const msg = await this.message.parse(message);
      log("Is not a handshake message", msg);

      if (msg.id === 0) await this.chokeHandler();
      if (msg.id === 1) await this.unchokeHandler();
      if (msg.id === 4) await this.haveHandler(msg.payload.block);
      if (msg.id === 5) await this.bitfieldHandler(msg.payload);
      if (msg.id === 7) await this.pieceHandler(msg.payload);
    }
  }

  private createConnection(): void {
    this.socket.connect(async () => {
      await this.socket.write(this.message.setHandshake(this.torrent));
    });
  }

  protected getMessageSize(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private async onWholeMessage(callback: (data: Buffer) => void): Promise<void> {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.onData(message => {
      const msgLen = this.getMessageSize(handshake, message);

      savedBuf = Buffer.concat([savedBuf, message]);

      while (savedBuf.length >= 4 && savedBuf.length >= msgLen) {
        callback(savedBuf.slice(0, msgLen));
        savedBuf = savedBuf.slice(msgLen);
        handshake = false;
      }
    });
  }

  public async chokeHandler(): Promise<void> {
    log("ChokeHandler socket end");
  }

  public async unchokeHandler(): Promise<void> {
    log("UnchokeHandler request new piece");
    this.queue.choked = false;
    await this.requestPiece();
  }

  public async haveHandler(payload: Buffer): Promise<void> {
    log("HaveHandler");
    const pieceIndex = payload.readUInt32BE(0);
    // TODO: this is not right
    const queueEmpty = String(this.queue.length) === "0";
    this.queue.queue(pieceIndex);

    if (queueEmpty) await this.requestPiece();
  }

  public async bitfieldHandler(payload: Buffer): Promise<void> {
    const queueEmpty = String(this.queue.length) === "0";

    log("BitfieldHandler", queueEmpty, payload);
    payload.forEach((byte, i) => {
      for (let j = 0; j < 8; j++) {
        if (byte % 2) this.queue.queue(i * 8 + 7 - j);
        byte = Math.floor(byte / 2);
      }
    });

    if (queueEmpty) await this.requestPiece();
  }

  public async pieceHandler(payload: Payload): Promise<void> {
    this.pieces.addReceived(payload);

    log("Piece Handler");

    const pieceLength = this.torrent.getInfo()["piece length"]
    const pieceStart = pieceLength + payload.begin;
    const offset = payload.index * pieceStart;

    fs.write(this.target, payload.block, 0, payload.block.length, offset, () => {
      log("Writing data to a target file");
    }); 

    if (this.pieces.isDone()) {
      log("Download finished");
      console.log("Download finished!");
      this.socket.shutdown();

      try {
        fs.closeSync(this.target);
      } catch (error) {
        log("Error file close", error);
        console.log("Error", error.message);
        return;
      }

      return;
    }
    await this.requestPiece();
  }

  public async requestPiece(): Promise<void> {
    log("Requesting a new piece");
    if (this.queue.choked) return null;

    while (this.queue.length) {
      const pieceBlock = this.queue.deque();

      if (this.pieces.needed(pieceBlock)) {
        await this.socket.write(this.message.setRequest(pieceBlock));
        this.pieces.addRequested(pieceBlock);
        break;
      }
    }
  }
}

export async function createDownloader(torrent: Torrent, target: string): Promise<Download> {
  const targetStatus = fs.lstatSync(target);

  if (!targetStatus.isDirectory()) {
    throw new Error("use a directory as a target to put the downloaded file(s) \n") 
  } 

  const targetPath = path.resolve(target);
  const download = new Download(torrent);

  download.setTargetFolder(targetPath);

  return download;
}
