import { Router } from 'express';
import {
  getAll,
  getOne,
  create,
  update,
  remove,
  reorder,
  bulkCreate,
} from '../controllers/experience.js';
import { verifyToken } from '../middleware/auth.js';
import {
  validateCreateExperience,
  validateUpdateExperience,
  validateExperienceId,
} from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// CRUD routes
router.get('/', getAll);
router.get('/:id', validateExperienceId, getOne);
router.post('/', validateCreateExperience, create);
router.put('/:id', validateUpdateExperience, update);
router.delete('/:id', validateExperienceId, remove);

// Bulk operations
router.post('/bulk', bulkCreate);
router.post('/reorder', reorder);

export default router;
