import dotenv from "dotenv";
dotenv.config();

import path from "path";

import { createTrackerList } from "./torrent";
import { createDownloader } from "./download";

/*

const len = process.argv.length;

konst file = `${process.argv[len - 2] || ""}`;
const target = `${process.argv[len - 1] || ""}`;

if (file === "" || target === "") {
  throw new Error(
    "pass the torrent file and forder to put the downloaded file(s) \n",
  );
}
*/


const { torrent, tracker } = createTrackerList("./file.torrent");
const downloader = createDownloader(
  torrent,
  path.resolve(__dirname, "..", "./data"),
);

tracker.getPeers().then(peers => {
  downloader.download(peers)
})
