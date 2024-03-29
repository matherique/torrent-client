import dotenv from "dotenv";
dotenv.config();

import path from "path";

import { createTrackerList } from "./torrent";
import { createDownloader } from "./download";

const len = process.argv.length;

const file = `${process.argv[len - 2] || ""}`;
const target = `${process.argv[len - 1] || ""}`;

if (file === "" || target === "") {
  throw new Error(
    "pass the torrent file and forder to put the downloaded file(s) \n",
  );
}

(async () => {
  try {
    const { torrent, tracker } = await createTrackerList(file);
    const downloader = await createDownloader(
      torrent,
      path.resolve(__dirname, "..", target),
    );

    const peers = await tracker.getPeers();
    await Promise.all(peers.map((peer) => downloader.pull(peer)))
  } catch (error) {
    console.log(error);
  }
})();
