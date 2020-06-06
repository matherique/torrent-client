import * as fs from "fs";
import * as path from "path";
import { Socket } from "net";
import { Buffer } from "buffer";

import { Torrent } from "../torrent";
import Queue from "./queue";
import Message from "../message";
import Pieces from "./pieces";

import { Peer, Payload } from "../types";
import { createLogger } from "../logger";

const log = createLogger("Download");

export default class Download {
  private socket: Socket;
  private torrent: Torrent;
  private message: Message;
  private pieces: Pieces;
  private target: number;
  private queue: Queue;
  private connected: Peer[] = [];

  constructor(torrent: Torrent, targetFolder: string) {
    this.message = new Message();
    this.torrent = torrent;

    const targetPath = path.resolve(
      __dirname,
      targetFolder,
      this.torrent.getInfo().name.toString(),
    );

    this.target = fs.openSync(targetPath, "w");
  }

  // TODO: this is a good way to deal with this ?
  public pull(peer: Peer): void {
    this.socket = new Socket();

    this.onError(peer);
    this.createConnection(peer);

    this.socket.on("drain", () => log("Drain:", peer));
    this.socket.on("connect", () => log("Connected:", peer));
    this.socket.on("lookup", (...args) => log("Lookup:", args));
    this.socket.on("end", () => log("End connection", peer));

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

  private createConnection(peer: Peer): void {
    const { port, ip } = peer;

    this.socket.connect(port, ip, () => {
      log("Init connection", { ip, port });
      this.connected.push(peer);
      const resp = this.socket.write(this.message.setHandshake(this.torrent));
      if (resp) {
        log("Response Socket Write", "true");
      } else {
        log("Response Socket Write", "false");
      }
    });
  }

  protected getMessageSize(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", (message) => {
      log("Getting data", message);
      const msgLen = this.getMessageSize(handshake, message);

      savedBuf = Buffer.concat([savedBuf, message]);

      while (savedBuf.length >= 4 && savedBuf.length >= msgLen) {
        callback(savedBuf.slice(0, msgLen));
        savedBuf = savedBuf.slice(msgLen);
        handshake = false;
      }
    });
  }

  private onError(peer: Peer): void {
    this.socket.on("error", (error) => {
      log("Error connection", error.message);

      const connectedIndex = this.connected.findIndex(p=> p === peer);
      this.connected.splice(connectedIndex, 1);

      if (this.connected.length)
        log("Peers Connected", this.connected.length);

      this.socket.destroy();
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
        log("Writing data to a target file");
      },
    );

    if (this.pieces.isDone()) {
      log("Download finished");
      this.socket.end();

      try {
        fs.closeSync(this.target);
      } catch (error) {
        log("Error file close", error);
        return;
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
