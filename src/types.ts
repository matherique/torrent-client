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
};

export type KeepAliveMessage = Buffer;

export interface UDPSocket {
  send(message: Buffer): void;
  shutdown(): Promise<void>;
  onMessage(callback: (message: Buffer) => Promise<void>): void;
  isClosed: () => boolean
}

export interface TCPSocket {
  connect(): Promise<void>;
  loggs(): void;
  onData(callback: (data: Buffer) => void): void;
  write(message: Buffer): Promise<boolean>;
  shutdown(): void;
  getId(): number;
}
