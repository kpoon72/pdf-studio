import { Request, Response } from 'express';
import { mergePDFs } from '../utils/pdfProcessor';
import { getTempPath } from '../utils/fileManager';
import * as fs from 'fs';

export async function mergePDFsController(req: Request, res: Response): Promise<void> {
  try {
    const { fileIds } = req.body as { fileIds: string[] };
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
      res.status(400).json({ success: false, error: 'At least 2 file IDs are required' });
      return;
    }

    const filePaths = fileIds.map(id => getTempPath(id));
    for (const fp of filePaths) {
      if (!fs.existsSync(fp)) {
        res.status(404).json({ success: false, error: `File not found: ${fp}` });
        return;
      }
    }

    const mergedBytes = await mergePDFs(filePaths);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
    res.send(Buffer.from(mergedBytes));
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Merge failed' });
  }
}
