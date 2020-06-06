import { Socket, createSocket }from "dgram";

import { createLogger } from "../logger";

const log = createLogger("UDP Socket");

let reconnect = false;
let intervalID = null;

export default class UDPSocket {
  protected socket: Socket;
  protected hostname: string;
  protected port: number;

  constructor(hostname: string, port: number) {
    this.hostname = hostname;
    this.port = port;
    this.socket = createSocket("udp4"); 
  }

  protected createNewSocketConnection(): void {
    log("Creating new socket connection");
    this.socket = createSocket("udp4");
  }

  send(message: Buffer): void {
    log("Sending message");
    this.socket.send(message, 0, message.length, this.port, this.hostname, (error) => {
      reconnect = true;
      if (error) log("Error sending message", error);
    });
    this.reconnect(message);
  }

  shutdown(): void {
    log("Closing UDP connection");
    this.socket.close();
  }

  async onMessage(callback: (response: Buffer) => Promise<void>): Promise<void> {
    this.socket.on("message", async (response, info) => {
      reconnect = false;
      clearInterval(intervalID);

      log("Message Info", info);
      callback(response);
    })
  }

  reconnect(message: Buffer): void {
    intervalID =  setInterval(() => {
      if (reconnect) {
        this.shutdown();
        this.createNewSocketConnection();
        
        this.send(message);
        log("Reconnecting UDP connection");
      }
    }, 15000);
  }
}
