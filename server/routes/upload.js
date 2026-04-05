/**
 * Upload Routes
 * Handles PDF resume upload and parsing
 */
import { Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.js';
import uploadController from '../controllers/upload.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

/**
 * POST /api/upload/resume
 * Upload and parse a PDF resume
 * Returns parsed experiences for user review
 */
router.post(
  '/resume',
  (req, res, next) => {
    uploadController.upload.single('resume')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'file_too_large',
            message: 'File exceeds the 5MB size limit',
          });
        }
        return res.status(400).json({
          error: 'upload_error',
          message: err.message,
        });
      }
      if (err) {
        return res.status(400).json({
          error: 'upload_error',
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  },
  uploadController.parseResumeFile
);

/**
 * POST /api/upload/resume/confirm
 * Save parsed experiences to the database
 */
router.post('/resume/confirm', uploadController.confirmParsedResume);

export default router;
