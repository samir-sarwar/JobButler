import MasterExperience from '../models/MasterExperience.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Get all experiences for the current user
 * GET /api/experiences
 */
export const getAll = async (req, res, next) => {
  try {
    const { type, includeHidden } = req.query;
    
    const filter = { userId: req.user._id };
    
    // Filter by type if provided
    if (type) {
      if (!['work', 'project', 'education', 'skill'].includes(type)) {
        throw createError(400, 'validation_error', 'Invalid type filter');
      }
      filter.type = type;
    }
    
    // Only include visible entries by default
    if (includeHidden !== 'true') {
      filter.visible = true;
    }
    
    const experiences = await MasterExperience
      .find(filter)
      .sort({ priority: 1, createdAt: -1 });
    
    res.json(experiences);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single experience by ID
 * GET /api/experiences/:id
 */
export const getOne = async (req, res, next) => {
  try {
    const experience = await MasterExperience.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!experience) {
      throw createError(404, 'not_found', 'Experience not found');
    }
    
    res.json(experience);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new experience
 * POST /api/experiences
 */
export const create = async (req, res, next) => {
  try {
    const {
      type,
      title,
      organization,
      location,
      startDate,
      endDate,
      bullets,
      tags,
      priority,
      visible,
    } = req.body;
    
    const experience = new MasterExperience({
      userId: req.user._id,
      type,
      title,
      organization,
      location,
      startDate,
      endDate,
      bullets,
      tags,
      priority: priority ?? 0,
      visible: visible ?? true,
    });
    
    await experience.save();
    
    res.status(201).json(experience);
  } catch (error) {
    next(error);
  }
};

/**
 * Update an experience
 * PUT /api/experiences/:id
 */
export const update = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'type',
      'title',
      'organization',
      'location',
      'startDate',
      'endDate',
      'bullets',
      'tags',
      'priority',
      'visible',
    ];
    
    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const experience = await MasterExperience.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!experience) {
      throw createError(404, 'not_found', 'Experience not found');
    }
    
    res.json(experience);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an experience
 * DELETE /api/experiences/:id
 */
export const remove = async (req, res, next) => {
  try {
    const experience = await MasterExperience.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    
    if (!experience) {
      throw createError(404, 'not_found', 'Experience not found');
    }
    
    res.json({ message: 'Experience deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder experiences (update priorities)
 * POST /api/experiences/reorder
 */
export const reorder = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    
    if (!Array.isArray(orderedIds)) {
      throw createError(400, 'validation_error', 'orderedIds must be an array');
    }
    
    // Update each experience's priority
    const updates = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, userId: req.user._id },
        update: { $set: { priority: index } },
      },
    }));
    
    await MasterExperience.bulkWrite(updates);
    
    res.json({ message: 'Experiences reordered successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk create experiences
 * POST /api/experiences/bulk
 */
export const bulkCreate = async (req, res, next) => {
  try {
    const { experiences } = req.body;
    
    if (!Array.isArray(experiences) || experiences.length === 0) {
      throw createError(400, 'validation_error', 'experiences must be a non-empty array');
    }
    
    if (experiences.length > 50) {
      throw createError(400, 'validation_error', 'Cannot create more than 50 experiences at once');
    }
    
    // Add userId and ensure valid bullets format
    const experiencesToSave = experiences.map((exp, index) => ({
      userId: req.user._id,
      type: exp.type,
      title: exp.title,
      organization: exp.organization,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: (exp.bullets || []).map(b => 
        typeof b === 'string' ? { text: b } : b
      ),
      tags: exp.tags || [],
      priority: exp.priority ?? index,
      visible: exp.visible ?? true,
    }));
    
    const savedExperiences = await MasterExperience.insertMany(experiencesToSave);
    
    res.status(201).json({
      message: `Created ${savedExperiences.length} experiences`,
      count: savedExperiences.length,
      experiences: savedExperiences,
    });
  } catch (error) {
    next(error);
  }
};
