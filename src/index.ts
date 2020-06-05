import { createTrackerList } from "./torrent";
import { createDownloader } from "./download";

const file = `${process.argv[2] || ""}`;
const target = `${process.argv[3] || ""}`;

if (file === "" || target === "") {
  throw new Error("informe torrent file and folder to put the dowloaded file(s)");
}

(async () => {
  const { torrent, tracker } = await createTrackerList(file);
  const downloader = await createDownloader(torrent, target);

  tracker.getPeers((peers) => {
    peers.forEach((peer) => {
      downloader.pull(peer);
    });
  });
})();
