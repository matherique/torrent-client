import { Socket } from "net";
import { createLogger } from "../logger";
import { TCPSocket } from "../types";

let id = 0;
const log = createLogger("TCP Socket");

export default class TCP implements TCPSocket {
  private readonly id: number;
  private socket: Socket;

  constructor(private host: string, private port: number, logs = true) {
    this.id = ++id;
    
    this.port = port;
    this.host = host;

    this.socket = new Socket();

    if (logs) this.loggs();
  }
  
  connect(callback: () => void): void {
    const logData = { port: this.port, host: this.host };
    log("Init Connection ", this.id, logData);

    this.socket.connect(this.port, this.host, () => {
      callback();
    });
  }
  
  loggs(): void {
    const logData = { port: this.port, host: this.host };

    this.socket.on("drain", () => log("Drain", this.id, logData));
    this.socket.on("connect", () => log("Connected", this.id, logData));
    this.socket.on("lookup", (...args) => log("Lookup", this.id, logData, args));
    this.socket.on("end", () => log("End connection", this.id, logData));

    this.socket.on("error", (error) => {
      log("Error connection", this.id, error.message);
      this.shutdown();
    });
  }

  onData(callback: (data: Buffer) => void): void {
    this.socket.on("data", callback);
  }

  async write(message: Buffer): Promise<boolean> {
    return this.socket.write(message, (error) => {
      if (error)
        log("Error write message", this.id, error);
    })
  }

  shutdown(): void {
    log("Shutdown Connection", this.id);
    this.socket.end();
  }
}
