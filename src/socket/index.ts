import TCP from "./tcp";
import UDP from "./udp";

import { UDPSocket, TCPSocket } from "../types";

export function createTCPConnection(host: string, port: number): TCPSocket {
  return new TCP(host, port);
}

export function createUDPConnection(host: string, port: number): UDPSocket {
  return new UDP(host, port);
}
