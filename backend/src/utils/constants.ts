export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600', 10); // 100MB
export const FILE_EXPIRY_DAYS = parseInt(process.env.FILE_EXPIRY_DAYS || '7', 10);
export const STORAGE_ROOT = process.env.STORAGE_ROOT || '/data/uploads';
export const PORT = parseInt(process.env.PORT || '3000', 10);

export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 20;

export const FILE_EXPIRY_MS = FILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
