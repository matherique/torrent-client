import { Socket } from "net";
import { Buffer } from "buffer";

import Tracker from "./tracker";
import Torrent from "./torrent";
import Message from "./message";
import { Peer } from "./types";

export default class Download {
  private socket: Socket;
  private tracker: Tracker;
  private torrent: Torrent;

  constructor(tracker: Tracker, torrent: Torrent) {
    this.socket = new Socket();
    this.tracker = tracker;
    this.torrent = torrent;
  }

  public pull(peer: Peer): void {
    this.onError();
    this.connect(peer);
  }

  private connect({ port, ip }: Peer): void {
    this.socket.connect(port, ip, () => {
      this.socket.write(Message.setHandShake(this.torrent));
    });
  }

  private onWholeMessage(callback: (data: Buffer) => void): void {
    let savedBuf = Buffer.alloc(0);
    let handshake = true;

    this.socket.on("data", (response) => {
      const msgLen = () => handshake 
        ? response.readUInt8(0) + 49 : response.readInt32BE(0) + 4;

      savedBuf = Buffer.concat([savedBuf, response]);
      
      while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
        callback(savedBuf.slice(0, msgLen()));
        savedBuf = savedBuf.slice(msgLen());
        handshake = false;
      }
    });
  }

  public handler(msg: Buffer): void {
    if (Message.isHandshake(msg)) 
      this.socket.write(Message.setInterested());
  }


  private onError(): void {
    this.socket.on("error", (error) =>
      console.log("download push error", error.message),
    );
  }

}
