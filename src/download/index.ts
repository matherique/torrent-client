import * as path from "path";
import * as fs from "fs/promises";

import Download from "./download";
import { Torrent } from "../torrent";

export async function createDownloader(torrent: Torrent, target: string): Promise<Download> {
  const targetStatus = await fs.lstat(target);

  if (!targetStatus.isDirectory()) {
    throw new Error("use a directory as a target to put the downloaded file(s) \n") 
  } 

  const targetPath = path.resolve(target);
  return new Download(torrent, targetPath);
}
