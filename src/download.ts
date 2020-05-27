import { Socket } from "net";
import { Buffer } from "buffer";

import Torrent from "./torrent";
import Message from "./message";
import { Peer } from "./types";

export default class Download {
  private socket: Socket;
  private torrent: Torrent;

  constructor(torrent: Torrent) {
    this.socket = new Socket();
    this.torrent = torrent;
  }

  // TODO: this is a good way to deal with this ?
  public pull(peer: Peer): void {
    this.onError();
    this.connect(peer);

    this.onWholeMessage((message) => {
      if (Message.isHandshake(message)) {
        this.socket.write(Message.setInterested());
      }
    });
  }

  private connect({ port, ip }: Peer): void {
    this.socket.connect(port, ip, () => {
      this.socket.write(Message.setHandshake(this.torrent));
    });
  }

  protected getMsgLength(handshake: boolean, message: Buffer): number {
    return handshake ? message.readUInt8(0) + 49 : message.readInt32BE(0) + 4;
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", (response) => {
      const msgLen = this.getMsgLength(handshake, response);

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
      console.log("download push error", error.message),
    );
  }
}
