import { Torrent ,BLOCK_LEN } from "../torrent";
import { PieceBlock  } from "../types";

export default class Queue {
  public choked: boolean;
  protected torrent: Torrent;
  protected items: PieceBlock[];

  constructor(torrent: Torrent) {
    this.torrent = torrent;
    this.choked = true;
    this.items = [];
  }

  public queue(index: number): void {
    const nBlocks = this.torrent.blocksPerPieces(index);
    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock = {
        index: index,
        begin: i * BLOCK_LEN,
        length: this.torrent.blockLen(index, i),
      };

      this.items.push(pieceBlock);
    }
  }

  public deque(): PieceBlock {
    return this.items.shift();
  }

  public peek(): PieceBlock {
    return this.items[0];
  }

  public length(): number {
    return this.items.length;
  }
}
