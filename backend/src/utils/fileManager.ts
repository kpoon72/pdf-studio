import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export function ensureDirectories(): void {
  [UPLOAD_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function getTempPath(fileId: string): string {
  return path.join(TEMP_DIR, `${fileId}.pdf`);
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function cleanupOldFiles(): void {
  if (!fs.existsSync(TEMP_DIR)) return;
  const files = fs.readdirSync(TEMP_DIR);
  const now = Date.now();
  files.forEach(file => {
    const filePath = path.join(TEMP_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > MAX_AGE_MS) fs.unlinkSync(filePath);
    } catch { /* ignore */ }
  });
}

export function getTempDir(): string {
  return TEMP_DIR;
}
