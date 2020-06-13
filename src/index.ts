import dotenv from "dotenv";
dotenv.config();

import { createTrackerList } from "./torrent";
import { createDownloader } from "./download";

const len = process.argv.length;

const file = `${process.argv[len - 2] || ""}`;
const target = `${process.argv[len - 1] || ""}`;

if (file === "" || target === "") {
  throw new Error("informe torrent file and folder to put the dowloaded file(s) \n");
}

(async () => {
  const { torrent, tracker } = await createTrackerList(file);
  const downloader = await createDownloader(torrent, target);

  tracker.getPeers((peers) => {
    peers.forEach((peer) => {
      downloader.pull(peer);
    });
    console.log("fim app pers");
  });
})();
