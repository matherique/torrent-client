export type TimeStamp = number;

export type TorrentPices = {
  length: number;
  name: Buffer;
  "piece length": number;
  piece: Buffer;
  files?: Buffer[];
}

export type TorrentInfo = {
  announce: Buffer; 
  "announce-list": Buffer[]; 
  "created by": string;
  "creation date": TimeStamp;
  encoding: Buffer;
  info: TorrentPices;
}

export type ConnectResponse = {
  connectionId: Buffer;
  action: number;
  transactionId: number;
}
