import mongoose from 'mongoose';

const BulletSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Bullet text is required'],
    maxlength: [300, 'Bullet text cannot exceed 300 characters'],
  },
}, { _id: false });

const MasterExperienceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  type: {
    type: String,
    enum: {
      values: ['work', 'project', 'education', 'skill'],
      message: 'Type must be one of: work, project, education, skill',
    },
    required: [true, 'Type is required'],
  },
  // Display fields
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters'],
  },
  organization: {
    type: String,
    trim: true,
    maxlength: [120, 'Organization cannot exceed 120 characters'],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [80, 'Location cannot exceed 80 characters'],
  },
  startDate: {
    type: String,
    trim: true,
    maxlength: [20, 'Start date cannot exceed 20 characters'],
  },
  endDate: {
    type: String,
    trim: true,
    maxlength: [20, 'End date cannot exceed 20 characters'],
  },
  // Content fields
  bullets: {
    type: [BulletSchema],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 8;
      },
      message: 'Maximum 8 bullets per experience entry',
    },
  },
  tags: {
    type: [String],
    default: [],
  },
  // Metadata
  priority: {
    type: Number,
    default: 0,
  },
  visible: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
MasterExperienceSchema.index({ userId: 1, type: 1 });
MasterExperienceSchema.index({ userId: 1, priority: 1 });
MasterExperienceSchema.index({ userId: 1, visible: 1 });

const MasterExperience = mongoose.model('MasterExperience', MasterExperienceSchema);

export default MasterExperience;
