import { Torrent, BLOCK_LEN } from "../torrent";

import { PieceBlock } from "../types";

type Requested = boolean[][];
type Recieved = boolean[][];

export default class Pieces {
  protected requested: Requested;
  protected received: Recieved;
  protected torrent: Torrent;

  constructor(torrent: Torrent) {
    this.torrent = torrent;
    this.received = this.buildPiecesArray();
    this.requested = this.buildPiecesArray();
  }

  public getRecieved(): Recieved {
    return this.received;
  }

  public getRequested(): Requested {
    return this.requested;
  }

  public addReceived(pieceBlock: PieceBlock): void {
    const blockIndex = pieceBlock.length / BLOCK_LEN;
    this.received[pieceBlock.index][blockIndex] = true;
  }

  public addRequested(pieceBlock: PieceBlock): void {
    const blockIndex = pieceBlock.length / BLOCK_LEN;
    this.received[pieceBlock.index][blockIndex] = true;
  }

  public needed(pieceBlock: PieceBlock): boolean {
    if (this.requested.every((blocks) => blocks.every(i => i))) {
      this.requested = this.received.map(blocks => blocks.slice());
    }

    const blockIndex = pieceBlock.begin / BLOCK_LEN;
    return !this.requested[pieceBlock.index][blockIndex];
  }

  public isDone(): boolean {
    return this.received.every(blocks => blocks.every(i => i));
  }

  private buildPiecesArray(): boolean[][] {
    const nPieces = this.torrent.getPiecesSize() / 20;
    const arr = new Array(nPieces).fill(null);

    return arr.map((_, i) => {
      return new Array(this.torrent.blocksPerPieces(i)).fill(false);
    });
  }
}
