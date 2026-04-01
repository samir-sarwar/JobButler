import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  // Resume header fields
  name: {
    type: String,
    trim: true,
    maxlength: [120, 'Name cannot exceed 120 characters'],
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone cannot exceed 20 characters'],
  },
  linkedinUrl: {
    type: String,
    trim: true,
    maxlength: [200, 'LinkedIn URL cannot exceed 200 characters'],
  },
  githubUrl: {
    type: String,
    trim: true,
    maxlength: [200, 'GitHub URL cannot exceed 200 characters'],
  },
}, {
  timestamps: { createdAt: true, updatedAt: true },
});

// Index for email lookup
UserSchema.index({ email: 1 }, { unique: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Transform output (remove passwordHash)
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', UserSchema);

export default User;
