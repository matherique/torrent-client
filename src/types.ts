export type TimeStamp = number;

export type TorrentPices = {
  length: number;
  name: Buffer;
  "piece length": number;
  pieces: Buffer;
  files?: Buffer[];
};

export type TorrentInfo = {
  announce: Buffer;
  "announce-list": Buffer[];
  "created by": string;
  "creation date": TimeStamp;
  encoding: Buffer;
  info: TorrentPices;
};

export type ConnectResponse = {
  connectionId: Buffer;
  action: number;
  transactionId: number;
};

export type Peer = {
  ip: string;
  port: number;
};

export type AnnounceResponse = {
  action: number;
  transactionId: number;
  leechers: number;
  seeders: number;
  peers: Peer[];
};

export type PieceBlock = Payload;

export type Payload = {
  index: number;
  begin: number;
  length?: number;
  block?: Buffer;
};

export type MessageInfo = {
  size: number;
  id: number;
  payload?: Payload & Buffer;
}

export type KeepAliveMessage = Buffer;

export type ChokeMessage = {
  size: number;
  id: 0;
};

export type UnchokeMessage = {
  size: number;
  id: number;
};

export type InteresedMessage = {
  size: number;
  id: number;
};

export type UninterestedMessage = {
  size: number;
  id: number;
};

export type HaveMessage = {
  size: number;
  id: number;
  payload: Payload;
};

export type BitfieldMessage = {
  size: number;
  id: number;
  payload: Payload;
};

export type RequestMessage = {
  size: number;
  id: number;
  payload: Payload;
};

export type PieceMessage = {
  size: number;
  id: number;
  payload: Payload;
};

export type CancelMessage = {
  size: number;
  id: number;
  payload: Payload;
};

export type PortMessage = {
  size: number;
  id: number;
  payload: Payload;
};
