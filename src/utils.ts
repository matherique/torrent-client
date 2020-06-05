import crypto from "crypto";

let id: Buffer = null;

export function genId(): Buffer {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from('-AT0001-').copy(id, 0);
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
