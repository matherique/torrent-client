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

  public getTracker(): Url {
    return parse(this.data.announce.toString("utf8"));
  }

  public getDate(): TorrentInfo {
    return this.data;
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
      size = this.data.info.files.map((file) => file.length ).reduce((a, b) => a + b)
    }

    return bignum.toBuffer(size, { size: 8, endian : 'big'});
  }
}
