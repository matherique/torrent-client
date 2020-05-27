import Tracker from "./tracker";
import Torrent from "./torrent";
import Download from "./download";

let file = "../teste.torrent";

if (process.argv.length > 3 ) {
  file = process.argv[2];
}

const torrent = new Torrent(file);
const tracker = new Tracker(torrent);

const downloader = new Download(tracker, torrent);

tracker.getPeers(peers => {
  peers.forEach(peer => {
    downloader.pull(peer);
  });
});
