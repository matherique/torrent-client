import { Socket } from "net";
import { Buffer } from "buffer";

import Torrent from "./torrent";
import Message from "./message";
import { Peer, Payload } from "./types";

function getAdd({ ip, port }: Peer): string {
  return `${ip}:${port}`;
}

export default class Download {
  private socket: Socket;
  private torrent: Torrent;
  private message: Message;
  private connectedList: string[];

  constructor(torrent: Torrent) {
    this.socket = new Socket();
    this.message = new Message();
    this.torrent = torrent;
    this.connectedList = [];
  }

  // TODO: this is a good way to deal with this ?
  public pull(peer: Peer): void {
    this.onError();
    this.connect(peer);

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
      if (msg.id === 4) this.haveHandler(msg.payload);
      if (msg.id === 5) this.bitfieldHandler(msg.payload);
      if (msg.id === 7) this.pieceHandler(msg.payload);
    }
  }
  
  // TODO: mabe use promise
  private connect(peer: Peer): void {
    const { port, ip } = peer;

    console.log("connecting to ", getAdd(peer));

    if (!this.connectedList.find(p => p === getAdd(peer))) {
      this.socket.connect(port, ip, () => {
        this.socket.write(this.message.setHandshake(this.torrent));
      });
      this.connectedList.push(getAdd(peer));
    }
  }

  protected getMessageSize(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", (response) => {
      const msgLen = this.getMessageSize(handshake, response);

      savedBuf = Buffer.concat([savedBuf, response]);

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
    throw Error("chokeHandler not implemented");
  }

  public unchokeHandler(): void {
    throw Error("unchokeHandler not implemented");
  }

  public haveHandler(payload: Payload): void {
    throw Error("haveHandler not implemented");
  }

  public bitfieldHandler(payload: Payload): void {
    throw Error("bitfieldHandler not implemented");
  }

  public pieceHandler(payload: Payload): void {
    throw Error("pieceHandler not implemented");
  }
}
