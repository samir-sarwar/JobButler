import { Router } from 'express';
import {
  generateResume,
  downloadPdf,
  getSession,
} from '../controllers/tailor.js';
import { verifyToken } from '../middleware/auth.js';
import {
  validateTailor,
  validateSessionId,
} from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Tailor routes
// Note: GET /api/sessions is mounted separately in index.js (client uses that path)
router.post('/', validateTailor, generateResume);
router.get('/:sessionId', validateSessionId, getSession);
router.get('/:sessionId/pdf', validateSessionId, downloadPdf);

export default router;
