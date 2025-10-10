import { decode, encode } from "@msgpack/msgpack";

export type CursorData =
  | { sort: "name" | "-name"; value: string; id: string }
  | { sort: "createdAt" | "-createdAt"; value: string; id: string }
  | { sort: "level" | "-level"; value: number; id: string };

export function encodeCursor(data: CursorData): string {
  const packed = encode(data);
  return Buffer.from(packed).toString("base64url");
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const buffer = Buffer.from(cursor, "base64url");
    const data = decode(buffer) as CursorData;

    if (!data.sort || !data.id) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
