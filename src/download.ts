import * as fs from "fs";
import * as path from "path";
import { Socket } from "net";
import { Buffer } from "buffer";

import Torrent from "./torrent";
import Queue from "./queue";
import Message from "./message";
import Pieces from "./pieces";

import { Peer, Payload } from "./types";
import { createLogger } from "./logger";

const log = createLogger("Download");

export default class Download {
  private socket: Socket;
  private torrent: Torrent;
  private message: Message;
  private pieces: Pieces;
  private target: number;
  private queue: Queue;

  constructor(torrent: Torrent) {
    this.message = new Message();
    this.torrent = torrent;

    const targetPath = path.resolve(
      __dirname,
      "../target",
      this.torrent.getInfo().name.toString(),
    );

    this.target = fs.openSync(targetPath, "w");
  }

  // TODO: this is a good way to deal with this ?
  public pull(peer: Peer): void {
    this.socket = new Socket();

    this.onError();
    this.createConnection(peer);

    this.socket.on("connect", () => log("Connected:", peer));
    this.socket.on("lookup", (...args) => log("Lookup:", args));

    this.queue = new Queue(this.torrent);
    this.pieces = new Pieces(this.torrent);

    this.onWholeMessage((message) => {
      log("Get all message");
      this.messageHandler(message);
    });
  }

  private messageHandler(message: Buffer): void {
    log("Parsing Message");
    if (this.message.isHandshake(message)) {
      this.socket.write(this.message.setInterested());
    } else {
      const msg = this.message.parse(message);

      if (msg.id === 0) this.chokeHandler();
      if (msg.id === 1) this.unchokeHandler();
      if (msg.id === 4) this.haveHandler(msg.payload.block);
      if (msg.id === 5) this.bitfieldHandler(msg.payload);
      if (msg.id === 7) this.pieceHandler(msg.payload);
    }
  }

  private createConnection({ port, ip }: Peer): void {
    this.socket.connect(port, ip, () => {
      log("Init connection", { ip, port });
      this.socket.write(this.message.setHandshake(this.torrent));
    });
  }

  protected getMessageSize(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", (message) => {
      const msgLen = this.getMessageSize(handshake, message);

      savedBuf = Buffer.concat([savedBuf, message]);

      while (savedBuf.length >= 4 && savedBuf.length >= msgLen) {
        callback(savedBuf.slice(0, msgLen));
        savedBuf = savedBuf.slice(msgLen);
        handshake = false;
      }
    });
  }

  private onError(): void {
    this.socket.on("error", (error) => {
      log("Error connection", error);
    });
  }

  public chokeHandler(): void {
    log("ChokeHandler socket end");
    this.socket.end();
  }

  public unchokeHandler(): void {
    log("UnchokeHandler request new piece");
    this.queue.choked = false;
    this.requestPiece();
  }

  public haveHandler(payload: Buffer): void {
    log("HaveHandler");
    const pieceIndex = payload.readUInt32BE(0);
    // TODO: this is not right
    const queueEmpty = String(this.queue.length) === "0";
    this.queue.queue(pieceIndex);

    if (queueEmpty) this.requestPiece();
  }

  public bitfieldHandler(payload: Buffer): void {
    log("bitfieldHandler");
    const queueEmpty = String(this.queue.length) === "0";

    payload.forEach((byte, i) => {
      for (let j = 0; j < 8; j++) {
        if (byte % 2) this.queue.queue(i * 8 + 7 - j);
        byte = Math.floor(byte / 2);
      }
    });

    if (queueEmpty) this.requestPiece();
  }

  public pieceHandler(payload: Payload): void {
    this.pieces.addReceived(payload);

    log("Piece Handler");
    // write file
    const pieceLength = this.torrent.getInfo()["piece length"]
    const pieceStart = pieceLength + payload.begin;
    const offset = payload.index * pieceStart;

    fs.write(
      this.target,
      payload.block,
      0,
      payload.block.length,
      offset,
      () => {
        console.log("writing");
      },
    );

    if (this.pieces.isDone()) {
      console.log("DONE");
      this.socket.end();

      try {
        fs.closeSync(this.target);
      } catch (error) {
        console.log("file close: ", error);
      }

      return;
    }

    this.requestPiece();
  }

  public requestPiece(): void {
    log("Requesting a new piece");
    if (this.queue.choked) return null;

    while (this.queue.length) {
      const pieceBlock = this.queue.deque();

      if (this.pieces.needed(pieceBlock)) {
        this.socket.write(this.message.setRequest(pieceBlock));
        this.pieces.addRequested(pieceBlock);
        break;
      }
    }
  }
}
