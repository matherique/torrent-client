import { Buffer } from "buffer";
import crypto from "crypto";

let id: Buffer = null;

export function genId(): Buffer {
  if (!id) {
    id = crypto.randomBytes(12);
    Buffer.from('-MT0004-').copy(new Uint8Array(id), 0);
  }
  
  return id;
}

export function groupBySize(iterable: Buffer, groupSize: number): Buffer[]{
  const groups: Buffer[] = [];

  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize));
  }

  return groups;
}
