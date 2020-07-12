import dotenv from "dotenv";
dotenv.config();

import { createTrackerList } from "./torrent";
import { createDownloader } from "./download";

const len = process.argv.length;

const file = `${process.argv[len - 2] || ""}`;
const target = `${process.argv[len - 1] || ""}`;

if (file === "" || target === "") {
  throw new Error("pass the torrent file and forder to put the downloaded file(s) \n");
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
