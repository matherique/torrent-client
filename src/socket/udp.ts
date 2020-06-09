import { Socket, createSocket } from "dgram";

import { createLogger } from "../logger";
import { UDPSocket } from "../types";

const log = createLogger("UDP Socket");

const RECONNECT_TIME = 20 * 1000;

let reconnect = false;
let intervalID = null;

export default class UDP implements UDPSocket {
  protected socket: Socket;

  constructor(private hostname: string, private port: number) {
    this.hostname = hostname;
    this.port = port;
    this.socket = createSocket("udp4");
  }

  protected createNewSocketConnection(): void {
    log("Creating new socket connection");
    this.socket = createSocket("udp4");
  }

  async send(message: Buffer): Promise<void> {
    log("Sending message");

    this.socket.send(message, 0, message.length, this.port, this.hostname, (error) => {
      reconnect = true;
        if (error) log("Error sending message", error);
      this.reconnect(message); 
    }); 
  }

  shutdown(): void {
    log("Closing UDP connection");
    this.socket.close();
  }

  async onMessage(callback: (response: Buffer) => Promise<void>): Promise<void> {
    this.socket.on("message", async (response, info) => {
      this.stopReconnection();
      log("Message Info", info);
      callback(response);
    });
  }

  reconnect(message: Buffer): void {
    intervalID = setInterval(async () => {
      if (reconnect) {
        this.shutdown();
        this.createNewSocketConnection();

        await this.send(message);
        log("Reconnecting UDP connection");
      }
    }, RECONNECT_TIME);
  }

  stopReconnection(): void {
    reconnect = false;
    clearInterval(intervalID);
  }
}
