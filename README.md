# 📥 Bittorrent Client in Typescript

## Sources

- [bittorrent.org](http://www.bittorrent.org/beps/bep_0000.html)
- [wiki.theory.org](https://wiki.theory.org/index.php/BitTorrentSpecification)

## Motivation

I made this just for learning more about the UDP and TCP protocol, sockets,
buffers and dealing with this amount of calls.

In this project I made better logs, so i can see what's happening.

## Usage

To use you need to pass the .torrent file and the folder to put the downloaded
content

### Environment variable

- ALL_LOGS: display all logs, false is the default (true|false);
- TIMESTAMP_LOGS: display the logs with timestamp, day and time, false is the
  default (true|false);

```sh
npm start torrentfile folder
```

## Problem

The code doesn't work fully, the peers connect and most of the time the
connection die, I'm trying to figure out the solution for this problem.
