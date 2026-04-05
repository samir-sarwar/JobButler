/**
 * Upload Controller
 * Handles PDF resume upload and parsing
 */
import multer from 'multer';
import { extractText } from '../services/pdfParser.js';
import { parseResume } from '../services/kimiService.js';
import MasterExperience from '../models/MasterExperience.js';
import User from '../models/User.js';

// Configure multer for memory storage (no temp files)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * POST /api/upload/resume
 * Upload and parse a PDF resume
 */
export const parseResumeFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'no_file',
        message: 'No PDF file was uploaded',
      });
    }

    // Extract text from PDF
    console.log(`Extracting text from PDF (${req.file.size} bytes)...`);
    const resumeText = await extractText(req.file.buffer);
    
    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({
        error: 'empty_resume',
        message: 'Could not extract meaningful text from the PDF. Please ensure it contains selectable text.',
      });
    }

    console.log(`Extracted ${resumeText.length} characters, sending to LLM for parsing...`);
    
    // Parse resume text with LLM
    const { experiences, personalInfo } = await parseResume(resumeText);
    
    if (!experiences || experiences.length === 0) {
      return res.status(400).json({
        error: 'parse_failed',
        message: 'Could not parse any experience entries from the resume.',
      });
    }

    // Return parsed data for user review (don't save yet)
    res.json({
      message: 'Resume parsed successfully',
      experiences,
      personalInfo,
      rawTextLength: resumeText.length,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    
    if (error.name === 'KimiParseError' || error.name === 'KimiAPIError') {
      return res.status(502).json({
        error: 'llm_error',
        message: 'Failed to parse resume with AI. Please try again.',
      });
    }
    
    next(error);
  }
};

/**
 * POST /api/upload/resume/confirm
 * Save parsed experiences to the database
 */
export const confirmParsedResume = async (req, res, next) => {
  try {
    const { experiences, personalInfo, updateProfile } = req.body;
    
    if (!experiences || !Array.isArray(experiences) || experiences.length === 0) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'No experiences provided to save',
      });
    }

    // Add userId to each experience
    const experiencesToSave = experiences.map((exp, index) => ({
      ...exp,
      userId: req.user._id,
      priority: index, // Preserve order as priority
      bullets: (exp.bullets || []).map(b => 
        typeof b === 'string' ? { text: b } : b
      ),
    }));

    // Bulk insert experiences
    const savedExperiences = await MasterExperience.insertMany(experiencesToSave);
    
    // Optionally update user profile with personal info
    if (updateProfile && personalInfo) {
      const updateFields = {};
      if (personalInfo.name) updateFields.name = personalInfo.name;
      if (personalInfo.phone) updateFields.phone = personalInfo.phone;
      if (personalInfo.linkedinUrl) updateFields.linkedinUrl = personalInfo.linkedinUrl;
      
      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(req.user._id, updateFields);
      }
    }

    res.status(201).json({
      message: `Successfully imported ${savedExperiences.length} experiences`,
      count: savedExperiences.length,
      experiences: savedExperiences,
    });
  } catch (error) {
    console.error('Confirm resume error:', error);
    next(error);
  }
};

export default {
  upload,
  parseResumeFile,
  confirmParsedResume,
};
