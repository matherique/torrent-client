import * as fs from "fs";
import * as path from "path";

import Torrent, { BLOCK_LEN } from "./torrent";
import Tracker from "./tracker";

type TrackerList = {
  tracker: Tracker;
  torrent: Torrent;
};

export function createTrackerList(file: string): TrackerList {
  const fileStats = fs.lstatSync(file);

  if (!fileStats.isFile()) {
    throw new Error("use a torrent file as a parameter \n");
  }

  const filepath = path.resolve(file);
  const content = fs.readFileSync(filepath);

  const torrent = new Torrent(content);
  const tracker = new Tracker(torrent);

  return { torrent, tracker };
}

export { Torrent, Tracker, BLOCK_LEN };
