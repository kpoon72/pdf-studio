import { Request, Response } from 'express';
import { getPageCount } from '../utils/pdfProcessor';
import * as path from 'path';

export async function uploadFiles(req: Request, res: Response): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files uploaded' });
      return;
    }

    const fileInfos = await Promise.all(files.map(async file => {
      const pageCount = await getPageCount(file.path);
      const fileId = path.basename(file.filename, path.extname(file.filename));
      return {
        id: fileId,
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        pageCount,
        uploadedAt: new Date().toISOString(),
      };
    }));

    res.json({ success: true, data: fileInfos });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Upload failed' });
  }
}
