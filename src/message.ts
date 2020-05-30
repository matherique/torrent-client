import { Buffer } from "buffer";

import Torrent from "./torrent";
import { genId } from "./utils";

import { Payload, MessageInfo } from "./types";

export default class Message {
  // TODO: make more types based on possible messages
  public parse(message: Buffer): MessageInfo {
    const id = message.length > 4 ? message.readInt8(4) : null;
    const p = message.length > 5 ? message.slice(5) : null;

    let payload: Payload;

    const parsed = {
      size: message.readInt32BE(0),
      id: id,
    };

    if (id === 6 || id === 7 || id === 8) {
      const rest = p.slice(8);

      payload = {
        index: p.readInt32BE(0),
        begin: p.readInt32BE(4),
      };

      if (id === 7) {
        payload["block"] = rest;
      } else {
        payload["length"] = rest.readInt32BE(0);
      }

      parsed["payload"] = payload;
    }

    return parsed;
  }

  public isHandshake(message: Buffer): boolean {
    return (
      message.length === message.readUInt8(0) + 49 &&
      message.toString("utf8", 1) === "BitTorrent protocol"
    );
  }

  public setHandshake(torrent: Torrent): Buffer {
    const buf = Buffer.alloc(68);
    // pstrlen
    buf.writeUInt8(19, 0);
    // pstr
    buf.write("BitTorrent protocol", 1);
    // reserved
    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);
    // info hash
    torrent.getInfoHash().copy(buf, 28);
    // peer id
    buf.write(genId().toString());
    return buf;
  }

  public setKeepAlive(): Buffer {
    return Buffer.alloc(4);
  }

  public setChoke(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(0, 4);
    return buf;
  }

  public setUnchoke(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(1, 4);
    return buf;
  }

  public setInterested(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(2, 4);
    return buf;
  }

  public setUninterested(): Buffer {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(3, 4);
    return buf;
  }

  public setHave(pieceIndex: number): Buffer {
    const buf = Buffer.alloc(9);
    // length
    buf.writeUInt32BE(5, 0);
    // id
    buf.writeUInt8(4, 4);
    // piece index
    buf.writeUInt32BE(pieceIndex, 5);
    return buf;
  }

  public setBitfield(bitfield: Buffer): Buffer {
    const buf = Buffer.alloc(14);
    // length
    buf.writeUInt32BE(bitfield.length + 1, 0);
    // id
    buf.writeUInt8(5, 4);
    // bitfield
    bitfield.copy(buf, 5);
    return buf;
  }

  public setRequest(payload: Payload): Buffer {
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

  public setPiece(payload: Payload): Buffer {
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

  public setCancel(payload: Payload): Buffer {
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

  public setPort(payload: number): Buffer {
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
