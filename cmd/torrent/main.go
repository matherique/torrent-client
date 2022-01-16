package main

import (
	"log"
	"path/filepath"
)

func main() {
	fp, err := filepath.Abs("./data.torrent")

	if err != nil {
		log.Fatal("could not get absolute path: %v", err)
	}

	t := NewTorrent(fp)

	if err := t.GetPeers(); err != nil {
		log.Fatal(err)
	}
}
