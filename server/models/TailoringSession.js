import mongoose from 'mongoose';

const TailoringSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  // Job description inputs
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [120, 'Job title cannot exceed 120 characters'],
  },
  company: {
    type: String,
    trim: true,
    maxlength: [120, 'Company cannot exceed 120 characters'],
  },
  jobDescriptionRaw: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [20000, 'Job description cannot exceed 20,000 characters'],
  },
  // AI pipeline outputs
  extractedKeywords: {
    hardSkills: {
      type: [String],
      default: [],
    },
    softSkills: {
      type: [String],
      default: [],
    },
    roleKeywords: {
      type: [String],
      default: [],
    },
    seniorityLevel: {
      type: String,
      default: '',
    },
    coreResponsibilities: {
      type: [String],
      default: [],
    },
  },
  selectedExperienceIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MasterExperience',
    }],
    default: [],
  },
  // Generated content
  generatedLatex: {
    type: String,
  },
  pdfStoragePath: {
    type: String,
    default: null,
  },
  // Status for UI
  status: {
    type: String,
    enum: ['draft', 'verified', 'active'],
    default: 'verified',
  },
  version: {
    type: String,
    default: '1.0',
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Index for session history (most recent first)
TailoringSessionSchema.index({ userId: 1, createdAt: -1 });

const TailoringSession = mongoose.model('TailoringSession', TailoringSessionSchema);

export default TailoringSession;
