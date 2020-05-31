import { EventEmitter } from "events";

import Tracker from "./tracker";
import Torrent from "./torrent";
import Download from "./download";

let file = "torrents/teste.torrent";

EventEmitter.defaultMaxListeners = Infinity;


if (process.argv.length >= 3) {
  file = `${process.argv[2]}`;
}

console.log("Torrent File: ", file)

const torrent = new Torrent(file);
const tracker = new Tracker(torrent);
const downloader = new Download(torrent);

tracker.getPeers((peers) => {
  console.log("peers lenght: ", peers.length);

  peers.forEach((peer) => {
    downloader.pull(peer);
  });
});
