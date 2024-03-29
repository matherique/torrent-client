import crypto from "crypto";

import { genId, groupBySize } from "../utils";
import Torrent from "./torrent";
import { createLogger } from "../logger";
import { createUDPConnection } from "../socket";
import { UDPSocket, Peer, AnnounceResponse, ConnectResponse } from "../types";

const log = createLogger("Tracker");

export default class Tracker {
  private torrent: Torrent;
  protected socket: UDPSocket;

  constructor(torrent: Torrent) {
    this.torrent = torrent;

    const { port, hostname } = this.torrent.getTracker();
    this.socket = createUDPConnection(hostname, +port);
  }

  public async getPeers(): Promise<Peer[]> {
    const messageConnection = await this.createConnectionRequest();
    this.socket.send(messageConnection);

    return new Promise<Peer[]>((resolve) => {
      this.socket.onMessage(async (response) => {
        if (this.getResponseType(response) === "connect") {
          const announceRequest = await this.receiveConnectionResp(response);
          this.socket.send(announceRequest);

        } else if (this.getResponseType(response) === "announce") {
          const { peers } = await this.receiveAnnouceResp(response);
          this.socket.shutdown();

          resolve(peers);
        }
      });
    });
  }

  private async receiveAnnouceResp(
    response: Buffer,
  ): Promise<AnnounceResponse> {
    log("Receive annouce message");
    // 4. parse announce response
    const announceResp = await this.parseAnnounceResp(response);
    log("Annouce response ", announceResp);

    // 5. pass peers to callback
    log("Peers length", announceResp.peers.length);
    return announceResp;
  }

  private async receiveConnectionResp(response: Buffer): Promise<Buffer> {
    log("Receive connect message");
    // 2. receive and parse connect response
    const connResp = await this.parseConnectionResp(response);
    log("Connected response", connResp);
    // 3. send announce request
    const announceReq = await this.createAnnounceRequest(connResp.connectionId);
    return announceReq;
  }

  protected async createConnectionRequest(): Promise<Buffer> {
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

  protected getResponseType(response: Buffer): string {
    const action = response.readUInt32BE(0);

    if (action === 0) return "connect";
    return "announce";
  }

  protected async parseConnectionResp(
    response: Buffer,
  ): Promise<ConnectResponse> {
    return {
      action: response.readUInt32BE(0),
      transactionId: response.readUInt32BE(4),
      connectionId: response.slice(8),
    };
  }

  protected async createAnnounceRequest(
    connId: Buffer,
    port = 6881,
  ): Promise<Buffer> {
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

  protected async parseAnnounceResp(
    response: Buffer,
  ): Promise<AnnounceResponse> {
    const groupBuff = groupBySize(response.slice(20), 6);

    const peers = groupBuff
      .map((address) => {
        try {
          const ip = address.slice(0, 4).join(".")
          const port = address.readUInt16BE(4)

          return { ip, port }
        } catch (error) {
          return null
        }
      }).filter(Boolean);


    return new Promise((res) => {
      res({
        action: response.readUInt32BE(0),
        transactionId: response.readUInt32BE(4),
        leechers: response.readUInt32BE(8),
        seeders: response.readUInt32BE(12),
        peers,
      });
    });
  }

  public async shutdown(): Promise<void> {
    log("Close Socket connection")
    if (!this.socket.isClosed) {
      await this.socket.shutdown()
    }
  }
}
