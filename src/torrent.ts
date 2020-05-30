import * as fs from "fs";
import * as path from "path";
import bencode from "bencode";
import crypto from "crypto";
import bignum from "bignum";
import { Url, parse } from "url";

import { TorrentInfo, TorrentPices } from "./types";

export const BLOCK_LEN = Math.pow(2, 14);

export default class Torrent {
  protected bufContent: Buffer;
  protected file: string;
  protected data: TorrentInfo;

  constructor(arquivo: string) {
    this.file = path.resolve(__dirname, arquivo);
    this.bufContent = fs.readFileSync(this.file);
    this.data = this.open();
  }

  public getTracker(): Url {
    return parse(this.data.announce.toString("utf8"));
  }

  public getPiecesSize(): number {
    return this.data.info.piece.length;
  }

  public getInfo(): TorrentPices {
    return this.data.info;
  }

  public open(): TorrentInfo {
    return bencode.decode(this.bufContent) as TorrentInfo;
  }

  public getInfoHash(): Buffer {
    const info = bencode.encode(this.data.info);
    return crypto.createHash("sha1").update(info).digest();
  }

  public getSize(): Buffer {
    let size = this.data.info.length;

    if (this.data.info.files) {
      size = this.data.info.files.map((file) => file.length).reduce((a, b) => a + b)
    }

    return bignum.toBuffer(size, { size: 8, endian : 'big'});
  }

  public pieceLen(index: number): number { 
    const totalLength = bignum.fromBuffer(this.getSize()).toNumber();
    const pieceLength = this.getInfo()["piece length"];

    const lastPieceLength = totalLength % pieceLength;
    const lastPieceIndex = Math.floor(totalLength / pieceLength);

    return lastPieceIndex === index ? lastPieceLength : pieceLength;
  }

  public blocksPerPieces(index: number): number {
    const pieceLength = this.pieceLen(index);
    return Math.ceil(pieceLength / BLOCK_LEN);
  }

  public blockLen(pieceIndex: number, blockIndex: number): number { 
    const pieceLength = this.pieceLen(pieceIndex);

    const lastPieceLength = pieceLength % BLOCK_LEN;
    const lastPieceIndex = Math.floor(pieceLength / BLOCK_LEN);

    return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LEN;

  }

}
