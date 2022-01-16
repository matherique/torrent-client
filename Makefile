all: build run

build: 
	go build ./cmd/torrent

run:
	./torrent
