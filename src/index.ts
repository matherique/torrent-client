import Tracker from "./tracker";
import Torrent from "./torrent";
import Download from "./download";

let file = "../teste.torrent";

if (process.argv.length > 3 ) {
  file = process.argv[2];
}

const torrent = new Torrent(file);

const tracker = new Tracker(torrent);

const downloader = new Download(torrent);

tracker.getPeers(peers => {
  console.log("peers lenght: ", peers.length);
  const allips = peers.map(peer => peer.port);
  console.log("no repeated peers ip", new Set([...allips]).size);
  /*
  peers.forEach(peer => {
    // downloader.pull(peer);
  });
  */
});

