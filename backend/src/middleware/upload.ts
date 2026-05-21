import multer from 'multer';
import * as path from 'path';
import { Request } from 'express';
import { getTempDir, ensureDirectories } from '../utils/fileManager';
import * as crypto from 'crypto';

ensureDirectories();

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, getTempDir());
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const id = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isPDF = file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';
  if (isPDF) cb(null, true);
  else cb(new Error('Only PDF files are allowed'));
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 10 },
});
