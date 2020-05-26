import Client from "./client";

const torrentClient = new Client("../arquivo.torrent");
torrentClient.getPeers(peers => {
  console.log("list of peers", peers);
});
