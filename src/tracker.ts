import dgram from "dgram";
import crypto from "crypto";

import { ConnectResponse, AnnounceResponse, Peer } from "./types";
import { genId, groupBySize } from "./utils";
import Torrent from "./torrent";

export default class Tracker {
  private torrent: Torrent;

  constructor(torrent: Torrent) {
    this.torrent = torrent;
  }

  private createSocketConnection(): dgram.Socket {
    return dgram.createSocket("udp4");
  }

  public async getPeers(callback: (peers: Peer[]) => void): Promise<void> {
    const socket = this.createSocketConnection();
    const connReq = this.createConnectionRequest();
    let connected = false;

    this.send(socket, connReq);

    socket.on("connect", () => connected = true);

    socket.on("listening", () => console.log("is listening", connected));

    socket.on("error", error => console.log("Error tracker", error.message));

    socket.on("message", async (response, info) => {
      console.log("message info", info);
      if (this.getResponseType(response) === "connect") {
        connected = true;
        console.log("message: connect");
        // 2. receive and parse connect response
        const connResp = await this.parseConnectionResp(response);
        console.log("connresp", connResp)
        // 3. send announce request
        const announceReq = this.createAnnounceRequest(connResp.connectionId);

        this.send(socket, announceReq);
      } else if (this.getResponseType(response) === "announce") {
        console.log("message: announce");
        // 4. parse announce response
        const announceResp = await this.parseAnnounceResp(response);

        console.log("announceResp", announceResp)
        // 5. pass peers to callback
        callback(announceResp.peers);
      }
    });
  } 

  protected createConnectionRequest(): Buffer {
    const buf = Buffer.alloc(16); // 2

    // connection id
    buf.writeUInt32BE(0x417, 0); // 3
    buf.writeUInt32BE(0x27101980, 4);
    
    // action
    buf.writeUInt32BE(0, 8); // 4
    
    // transaction id
    crypto.randomBytes(4).copy(buf, 12); // 5

    return buf;
  }

  private send(socket: dgram.Socket, message: Buffer) {
    const { port, hostname } = this.torrent.getTracker();
    
    socket.send(message, 0, message.length, +port, hostname, (error, msg) => {
      console.log("MSG: ", msg);
      console.log("ERROR: ", error);
    });
  }

  protected getResponseType(response: Buffer): string {
    const action = response.readUInt32BE(0);
    
    if (action === 0) return 'connect';
    return 'announce';
  }

  protected async parseConnectionResp(response: Buffer): Promise<ConnectResponse> {
    return new Promise((res) =>
      res({
        action: response.readUInt32BE(0),
        transactionId: response.readUInt32BE(4),
        connectionId: response.slice(8),
      }),
    );
  }

  protected createAnnounceRequest(connId: Buffer, port = 6881): Buffer {
    const buf = Buffer.allocUnsafe(98);

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
  
  protected async parseAnnounceResp(response: Buffer): Promise<AnnounceResponse> {
    return new Promise(res => {
      res({
        action: response.readUInt32BE(0),
        transactionId: response.readUInt32BE(4),
        leechers: response.readUInt32BE(8),
        seeders: response.readUInt32BE(12),
        peers: groupBySize(response.slice(20), 6).map((address) => {
          return {
            ip: address.slice(0, 4).join("."),
            port: address.readUInt16BE(4),
          } as Peer;
        }),
      });
    })
  }
}
