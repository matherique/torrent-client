export default class Queue {
  protected choked: boolean;
  protected items: number[];
  
  constructor() {
    this.choked = true;
    this.items = [];
  }

  public isChoked(): boolean {
    return this.choked;
  }
}
