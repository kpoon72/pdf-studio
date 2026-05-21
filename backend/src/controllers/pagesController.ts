import { Request, Response } from 'express';
import { rotatePages, deletePages, reorderPages } from '../utils/pdfProcessor';
import { getTempPath } from '../utils/fileManager';
import * as fs from 'fs';
import * as crypto from 'crypto';

function newTempId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function rotatePagesController(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, pageIndices, degrees } = req.body as { fileId: string; pageIndices: number[]; degrees: number };
    const filePath = getTempPath(fileId);
    if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, error: 'File not found' }); return; }
    const result = await rotatePages(filePath, pageIndices, degrees);
    const newId = newTempId();
    fs.writeFileSync(getTempPath(newId), result);
    res.json({ success: true, data: { fileId: newId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Rotate failed' });
  }
}

export async function deletePageController(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, pageIndices } = req.body as { fileId: string; pageIndices: number[] };
    const filePath = getTempPath(fileId);
    if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, error: 'File not found' }); return; }
    const result = await deletePages(filePath, pageIndices);
    const newId = newTempId();
    fs.writeFileSync(getTempPath(newId), result);
    res.json({ success: true, data: { fileId: newId } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
}

export async function reorderPagesController(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, newOrder } = req.body as { fileId: string; newOrder: number[] };
    const filePath = getTempPath(fileId);
    if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, error: 'File not found' }); return; }
    const result = await reorderPages(filePath, newOrder);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reordered.pdf"');
    res.send(Buffer.from(result));
  } catch (error) {
    res.status(500).json({ success: false, error: 'Reorder failed' });
  }
}
