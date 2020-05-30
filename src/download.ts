import { Socket } from "net";
import { Buffer } from "buffer";

import Torrent from "./torrent";
import Queue from "./queue";
import Message from "./message";
import Pieces from "./pieces";

import { Peer, Payload } from "./types";

function getAdd({ ip, port }: Peer): string {
  return `${ip}:${port}`;
}

export default class Download {
  private socket: Socket;
  private torrent: Torrent;
  private message: Message;
  private pieces: Pieces;
  private requested: boolean[];
  private queue: Queue;

  constructor(torrent: Torrent) {
    this.socket = new Socket();
    this.message = new Message();
    this.torrent = torrent;

    this.pieces = new Pieces(this.torrent);
  }

  // TODO: this is a good way to deal with this ?
  public pull(peer: Peer): void {
    this.onError();
    this.connect(peer);

    this.queue = new Queue(this.torrent);
    this.onWholeMessage((message) => {
      this.messageHandler(message);
    });
  }

  private messageHandler(message: Buffer): void {
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

  private connect({ port, ip }: Peer): void {
    console.log("connecting to ", getAdd({ port, ip }));

    this.socket.connect(port, ip, () => {
      this.socket.write(this.message.setHandshake(this.torrent));
    });
  }

  protected getMessageSize(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", message => {
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
    this.socket.on("error", (error) =>
      console.log("download push error", error),
    );
  }

  public chokeHandler(): void {
    this.socket.end();
  }

  public unchokeHandler(): void {
    this.queue.choked = false;
    this.requestPiece();
  }

  public haveHandler(payload: Buffer): void {
    const pieceIndex = payload.readUInt32BE();

    this.queue.queue(pieceIndex); 
    if (this.queue.queue.length === 1){
      this.requestPiece();
    }

    if (!this.requested[pieceIndex]) {
      this.socket.write(this.message.setRequest(null))
    }

    this.requested[pieceIndex] = true;
  }

  public bitfieldHandler(payload: Payload): void {
    throw Error("bitfieldHandler not implemented");
  }

  public pieceHandler(payload: Payload): void {
    throw Error("pieceHandler not implemented");
  }

  public requestPiece(): void{ 
    if (this.queue.choked)
      return null;

    while (this.queue.length){
      const pieceBlock = this.queue.deque();

      if(this.pieces.needed(pieceBlock)) {
        this.socket.write(this.message.setRequest(pieceBlock));
        this.pieces.addRequested(pieceBlock);
        break;
      }
    }
  }
}
