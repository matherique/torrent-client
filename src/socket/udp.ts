import { Socket, createSocket } from "dgram";

import { createLogger } from "../logger";
import { UDPSocket } from "../types";

const log = createLogger("UDP Socket");

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

  send(message: Buffer): void {
    log("Sending message");

    this.socket.send(
      message,
      0,
      message.length,
      this.port,
      this.hostname,
      async (error) => {
        if (error) {
          log("Error sending message", error);
        }
      },
    );
  }

  shutdown(): void {
    log("Closing UDP connection");
    this.socket.close();
  }

  onMessage(callback: (message: Buffer) => Promise<void>): void {
    this.socket.on("message", async (response, info) => {
      log("Message Info", info);
      callback(response);
    });
    this.socket.on("error", (error) => {
      console.error(error);
    });
  }
}
