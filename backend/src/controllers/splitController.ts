import { Request, Response } from 'express';
import { splitPDF, getPageCount } from '../utils/pdfProcessor';
import { getTempPath } from '../utils/fileManager';
import { parseRanges } from '../utils/rangeParser';
import * as fs from 'fs';

export async function splitPDFController(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, rangesInput } = req.body as { fileId: string; rangesInput: string };
    if (!fileId || !rangesInput) {
      res.status(400).json({ success: false, error: 'fileId and rangesInput are required' });
      return;
    }

    const filePath = getTempPath(fileId);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    const pageCount = await getPageCount(filePath);
    const ranges = parseRanges(rangesInput, pageCount);
    if (ranges.length === 0) {
      res.status(400).json({ success: false, error: 'No valid ranges provided' });
      return;
    }

    const splitBuffers = await splitPDF(filePath, ranges);

    if (splitBuffers.length === 1) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${ranges[0].label}.pdf"`);
      res.send(Buffer.from(splitBuffers[0]));
      return;
    }

    const result = splitBuffers.map((buf, i) => ({
      label: ranges[i].label,
      range: ranges[i],
      data: Buffer.from(buf).toString('base64'),
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Split failed' });
  }
}
