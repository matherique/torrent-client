import dgram from "dgram";
import crypto from "crypto";

import { ConnectResponse } from "./types";
import { genId } from "./utils";
import Torrent from "./torrent";

export default class Client {
  private torrent: Torrent;

  constructor(arquivo: string) {
    this.torrent = new Torrent(arquivo);
  }

  private createSocketConnection(): dgram.Socket {
    return dgram.createSocket("udp4");
  }

  public getPeers(callback: (peers: Buffer) => void): void {
    const socket = this.createSocketConnection();
    const connRes = this.buildConnReq();

    this.send(socket, connRes);

    socket.on("message", (response) => {
      if (this.getResponseType(response) === 'connect') {
        // 2. receive and parse connect response
        const connResp = this.parseConnResp(response);
        // 3. send announce request
        const announceReq = this.buildAnnounceReq(connResp.connectionId);
        this.send(socket, announceReq);
      } else if (this.getResponseType(response) === 'announce') {
        // 4. parse announce response
        const announceResp = this.parseAnnounceResp(response);
        // 5. pass peers to callback
        callback(announceResp.peers);
      }
    });
  }

  protected buildConnReq(): Buffer {
    const buf = Buffer.alloc(16); // 2
    // connectionId
    buf.writeUInt32BE(0x417, 0); // 3
    buf.writeUInt32BE(0x27101980, 4);
    // action
    buf.writeUInt32BE(0, 8); // 4
    // transaction id
    crypto.randomBytes(4).copy(buf, 12); // 5

    return buf;
  }

  private send(socket: dgram.Socket, message: Buffer) {
    const { port, host } = this.torrent.getTracker();
    socket.send(message, 0, message.length, +port, host, () => {});
  }

  protected getResponseType(response: Buffer): string {
    return "connect";
  }

  protected parseResponse(): string {
    return "";
  }

  protected parseConnResp(response: Buffer): ConnectResponse {
    return {
      action: response.readUInt32BE(0),
      transactionId: response.readUInt32BE(4),
      connectionId: response.slice(8)
    };
  }

  protected buildAnnounceReq(connId: Buffer): Buffer {
    const buf = Buffer.allocUnsafe(98);
    const { port } = this.torrent.getTracker();

    // connection id
    connId.copy(buf, 0);
    // action
    buf.writeUInt32BE(1, 8);
    // transaction id
    crypto.randomBytes(4).copy(buf, 12);
    // info hash
    this.torrent.getInfoHash().copy(buf, 16);
    // peerId
    genId().copy(buf, 36);
    // downloaded
    Buffer.alloc(8).copy(buf, 56);
    // left
    this.torrent.getSize().copy(buf, 64);
    // uploaded
    Buffer.alloc(8).copy(buf, 72);
    // event
    buf.writeUInt32BE(0, 80);
    // ip address
    buf.writeUInt32BE(0, 80);
    // key
    crypto.randomBytes(4).copy(buf, 88);
    // num want
    buf.writeInt32BE(-1, 92);
    // port
    buf.writeUInt16BE(+port, 96);

    return buf;
  }

  protected parseAnnounceResp(response: Buffer): string {
    return "";
  }

}
