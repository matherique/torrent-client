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

  public setChoked(value: boolean): void {
    this.choked = value;
  }

  public shift(): number {
    return this.items.shift();
  }

  public push(value: number): number {
    return this.items.push(value);
  }

  public size(): number {
    return this.items.length;
  }

}

