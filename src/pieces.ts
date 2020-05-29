
export default class Pieces {
  protected size: number;
  protected requested: boolean[];
  protected recieved: boolean[];

  constructor(size: number) { 
    this.size = size;
    this.recieved = new Array(this.size).fill(false);
    this.requested = new Array(this.size).fill(false);
  }
  
  public addReceived(index: number): void {
    this.recieved[index] = true;
  }

  public addRequested(index: number): void {
    this.requested[index] = true;
  }

  public needed(index: number): boolean {
    if (this.requested.every(i => i === true)) {
      this.requested = this.recieved.slice();
    }

    return !this.requested[index];
  }

  public isDone(): boolean {
    return this.recieved.every(i => i === true);
  }

}
