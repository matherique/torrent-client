import * as fs from "fs";
import * as path from "path";
import bencode from "bencode";
import crypto from "crypto";
import bignum from "bignum";
import { Url, parse } from "url";

import { TorrentInfo } from "./types";

export default class Torrent { 
  protected bufContent: Buffer;
  protected file: string;
  protected data: TorrentInfo;

  constructor(arquivo: string) {
    this.file = path.resolve(__dirname, arquivo);
    this.bufContent = fs.readFileSync(this.file);
    this.data = this.open();
  }

  getTracker(): Url {
    return parse(this.data.announce.toString("utf8"));
  }

  getDate(): TorrentInfo {
    return this.data;
  }
    
  protected open(): TorrentInfo {
    return bencode.decode(this.bufContent) as TorrentInfo;
  }

  getInfoHash(): Buffer {
    const info = bencode.encode(this.data.info);
    return crypto.createHash('sha1').update(info).digest();
  }
  
  getSize(): Buffer {
    const size = this.data.info.files ?
      this.data.info.files.map(file => file.length).reduce((a, b) => a + b) :
      this.data.info.length;

    return bignum.toBuffer(size, { size: 8, endian: 1 });
  }
}
