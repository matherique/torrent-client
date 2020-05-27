import { Buffer } from "buffer";

import Torrent from "./torrent";
import { genId } from "./utils";
import { Payload } from "./types";

export default class Message {

  public static isHandshake(msg: Buffer): boolean {
    return msg.length === msg.readUInt8(0) + 49 &&
      msg.toString('utf8', 1) === 'BitTorrent protocol';
  }

  public static setHandShake(torrent: Torrent): Buffer { 
    const buf = Buffer.alloc(68);
    // pstrlen
    buf.writeUInt8(19, 0);
    // pstr
    buf.write('BitTorrent protocol', 1);
    // reserved
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);
    // info hash
    torrent.getInfoHash().copy(buf, 28);
    // peer id
    buf.write(genId().toString());
    return buf;
  }

  public static setKeepAlive(): Buffer {
    return Buffer.alloc(4);
  }

  public static setChoke(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(0, 4);
    return buf;
  }

  public static setUnchoke(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(1, 4);
    return buf;
  }

  public static setInterested(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(2, 4);
    return buf;
  }

  public static setUninterested(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(3, 4);
    return buf;
  }

  public static setHave(payload: number): Buffer {
    const buf = Buffer.alloc(9);
    // length
    buf.writeUInt32BE(5, 0);
    // id
    buf.writeUInt8(4, 4);
    // piece index
    buf.writeUInt32BE(payload, 5);
    return buf;
  }

  public static setBitfield(bitfield: Buffer): Buffer {
    const buf = Buffer.alloc(14);
    // length
    buf.writeUInt32BE(bitfield.length + 1, 0);
    // id
    buf.writeUInt8(5, 4);
    // bitfield
    bitfield.copy(buf, 5);
    return buf;
  }

  public static setRequest(payload: Payload): Buffer {
    const buf = Buffer.alloc(17);
    // length
    buf.writeUInt32BE(13, 0);
    // id
    buf.writeUInt8(6, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
  }

  public static setPiece(payload: Payload): Buffer {
    const buf = Buffer.alloc(payload.block.length + 13);
    // length
    buf.writeUInt32BE(payload.block.length + 9, 0);
    // id
    buf.writeUInt8(7, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // block
    payload.block.copy(buf, 13);
    return buf;
  }

  public static setCancel(payload: Payload): Buffer {
    const buf = Buffer.alloc(17);
    // length
    buf.writeUInt32BE(13, 0);
    // id
    buf.writeUInt8(8, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
  }

  public static setPort(payload: number): Buffer {
    const buf = Buffer.alloc(7);
    // length
    buf.writeUInt32BE(3, 0);
    // id
    buf.writeUInt8(9, 4);
    // listen-port
    buf.writeUInt16BE(payload, 5);
    return buf;
  }
}

