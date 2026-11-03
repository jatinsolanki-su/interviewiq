import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeResume, embedText } from '../gemini.js';

const router = express.Router();

// Ensure local storage directory exists outside public access
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (ext === '.pdf' || mime === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF resume files are accepted.'));
    }
  }
});

/**
 * Text chunking utility for RAG
 */
function chunkText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  if (!text) return chunks;
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += (chunkSize - overlap);
  }
  return chunks;
}

/**
 * POST /api/resumes/upload
 * Upload and parse candidate resume PDF
 */
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a PDF resume file to upload.' });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // 1. Extract text using pdf-parse
    let parsedText = '';
    try {
      const pdfData = await pdfParse(fileBuffer);
      parsedText = pdfData.text || '';
    } catch (parseErr) {
      console.warn('[PDF Parse Warning]:', parseErr.message);
      parsedText = 'Resume uploaded: ' + req.file.originalname;
    }

    // Clean extracted text
    const cleanedText = parsedText.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

    // 2. Analyze resume with Gemini
    const analysis = await analyzeResume(cleanedText || req.file.originalname);

    // 3. Save resume metadata to PostgreSQL
    const insertResume = await query(
      `INSERT INTO resumes (
        user_id, filename, file_path, file_size, parsed_text,
        skills, experience, education, projects, strengths, missing_info, suggested_interview_topics
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        req.user.id,
        req.file.originalname,
        req.file.path,
        req.file.size,
        cleanedText,
        JSON.stringify(analysis.skills || []),
        JSON.stringify(analysis.experience || []),
        JSON.stringify(analysis.education || []),
        JSON.stringify(analysis.projects || []),
        JSON.stringify(analysis.strengths || []),
        JSON.stringify(analysis.missing_info || []),
        JSON.stringify(analysis.suggested_interview_topics || [])
      ]
    );

    const savedResume = insertResume.rows[0];

    // 4. Chunk text and generate embeddings for RAG
    const chunks = chunkText(cleanedText);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let embedding = null;
      try {
        embedding = await embedText(chunk);
      } catch (embErr) {
        // Fallback: embedding optional
      }

      await query(
        `INSERT INTO resume_chunks (resume_id, user_id, chunk_index, chunk_text, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [savedResume.id, req.user.id, i, chunk, embedding ? JSON.stringify(embedding) : null]
      );
    }

    return res.status(201).json({
      message: 'Resume uploaded and analyzed successfully',
      resume: savedResume
    });
  } catch (err) {
    console.error('[Resume Upload Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to process resume upload.' });
  }
});

/**
 * GET /api/resumes/my
 * Get the latest resume and all uploaded resumes for authenticated user
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({
      resumes: result.rows,
      activeResume: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (err) {
    console.error('[Resume Get Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve resumes.' });
  }
});

/**
 * DELETE /api/resumes/:id
 * Delete resume and associated chunks with user ownership check
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resumeResult = await query(
      'SELECT file_path FROM resumes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    // Attempt to delete physical file
    const filePath = resumeResult.rows[0].file_path;
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn('Could not delete physical file:', unlinkErr.message);
      }
    }

    // Delete record from PostgreSQL
    await query('DELETE FROM resumes WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);

    return res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('[Resume Delete Error]:', err);
    return res.status(500).json({ error: 'Failed to delete resume.' });
  }
});

export default router;
