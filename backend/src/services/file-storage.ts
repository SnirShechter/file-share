import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, unlink, access, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { STORAGE_ROOT } from '../utils/constants.js';

function getFilePath(fileId: string, originalFilename: string): string {
  const prefix = fileId.substring(0, 2);
  const ext = extname(originalFilename) || '';
  return `${prefix}/${fileId}${ext}`;
}

function getAbsolutePath(relativePath: string): string {
  return join(STORAGE_ROOT, relativePath);
}

export async function save(
  fileId: string,
  originalFilename: string,
  data: Buffer | ArrayBuffer
): Promise<string> {
  const relativePath = getFilePath(fileId, originalFilename);
  const absolutePath = getAbsolutePath(relativePath);

  await mkdir(dirname(absolutePath), { recursive: true });

  const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data;
  const readable = Readable.from(buffer);
  const writable = createWriteStream(absolutePath);
  await pipeline(readable, writable);

  return relativePath;
}

export function read(filePath: string): ReturnType<typeof createReadStream> {
  const absolutePath = getAbsolutePath(filePath);
  return createReadStream(absolutePath);
}

export async function remove(filePath: string): Promise<void> {
  const absolutePath = getAbsolutePath(filePath);
  try {
    await unlink(absolutePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function exists(filePath: string): Promise<boolean> {
  const absolutePath = getAbsolutePath(filePath);
  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const absolutePath = getAbsolutePath(filePath);
  const stats = await stat(absolutePath);
  return stats.size;
}
