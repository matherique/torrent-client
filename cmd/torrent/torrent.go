package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"

	"github.com/zeebo/bencode"
)

/*
Torrent file decoded example
Ex:
	{
		 "announce": "udp://tracker.openbittorrent.com:80/announce",
		 "announce-list": [
				["udp://tracker.openbittorrent.com:80/announce"],
				["udp://tracker.opentrackr.org:1337/announce"]
		 ],
		 "created by": "uTorrent/3.5.5",
		 "creation date": 1603775828,
		 "encoding": "UTF-8",
		 "info": {
				"length": 13132033,
				"name": "Legendas381.zip",
				"piece length": 16384,
				"pieces": "..." // all pieces
		 }
	}
*/

type Torrent struct {
	Announce     string     `bencode:"announce"`
	List         [][]string `bencode:"announce-list"`
	CreatedBy    string     `bencode:"created by"`
	CreationDate int64      `bencode:"creation date"`
	Encoding     string     `bencode:"encoding"`
	Info         struct {
		Length      int64  `bencode:"length"`
		Name        string `bencode:"name"`
		PieceLength int64  `bencode:"piece length"`
		Pieces      []byte `bencode:"pieces"`
	} `bencode:"info"`
}

func NewTorrent(filename string) *Torrent {
	t := new(Torrent)

	parse(filename, t)

	return t
}

func parse(filename string, t *Torrent) error {
	f, err := os.Open(filename)

	if err != nil {
		return fmt.Errorf("could not open the file %q: %v", filename, err)
	}

	if err := bencode.NewDecoder(f).Decode(&t); err != nil {
		return fmt.Errorf("could not decode file: %v", err)
	}

	return nil
}

func (t *Torrent) GetPeers() error {
	addr := strings.TrimRight(t.Announce, "/announce")
	addr = strings.TrimLeft(addr, "upd://")

	conn, err := net.Dial("udp", addr)

	if err != nil {
		return fmt.Errorf("could not connect to %s: %v", addr, err)
	}

	for {
		reader := bufio.NewReader(os.Stdin)
		fmt.Print(">> ")
		text, _ := reader.ReadString('\n')
		fmt.Fprintf(conn, text+"\n")

		message, _ := bufio.NewReader(conn).ReadString('\n')
		fmt.Print("->: " + message)
	}
}
