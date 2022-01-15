import { Socket, createSocket } from "dgram";

import { createLogger } from "../logger";
import { UDPSocket } from "../types";

const log = createLogger("UDP Socket");

export default class UDP implements UDPSocket {
  protected socket: Socket;
  protected closed: boolean

  constructor(private hostname: string, private port: number) {
    this.hostname = hostname;
    this.port = port;
    this.socket = createSocket("udp4", () => {
      this.closed = false 
    });
  }

  protected createNewSocketConnection(): void {
    log("Creating new socket connection");
    this.socket = createSocket("udp4");
  }

  send(message: Buffer): void {
    log("Sending message");

    this.socket.on("message", (...args) => log("On Message", ...args))
    this.socket.on("connect", (...args) => log("On connect", ...args))
    this.socket.on("error", (error) => log("On error", error.message))

    this.socket.send(
      message,
      0,
      message.length,
      this.port,
      this.hostname,
      (error, byts) => {
        if (error) {
          log("Error sending message", error);
        }
      },
    );
  }

  public shutdown(): Promise<void> {
    log("Closing UDP connection");
    return new Promise(resolve => {
      this.closed = true
      this.socket.close(resolve);
    })
  }

  public isClosed(): boolean {
    return this.closed
  }

  onMessage(callback: (message: Buffer) => Promise<void>): void {
    this.socket.on("message", (response, info) => {
      log("Message Info", info);
      callback(response);
    });

    this.socket.on("error", console.error);
  }
}
