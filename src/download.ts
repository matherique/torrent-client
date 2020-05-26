import { Socket } from "net";
import { Buffer } from "buffer";

import Tracker from "./tracker";
import { Peer } from "./types";

export default class Download {
  private socket: Socket;
  private tracker: Tracker;

  constructor(tracker: Tracker) {
    this.socket = new Socket();
    this.tracker = tracker;
  }

  pull(peer: Peer): void {
    this.socket.on("error", (error) =>
      console.log("download push error", error.message),
    );

    this.socket.connect(+peer.port, peer.ip, () => {
      console.log("writing a message");
    });

    this.socket.on("data", data => {
      console.log("data", data);
    });
  }
}
