import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name, phone, linkedinUrl, githubUrl } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw createError(409, 'email_taken', 'Email is already registered');
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      name,
      phone,
      linkedinUrl,
      githubUrl,
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw createError(401, 'invalid_credentials', 'Invalid email or password');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError(401, 'invalid_credentials', 'Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw createError(404, 'not_found', 'User not found');
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/auth/me
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, linkedinUrl, githubUrl } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        $set: { 
          ...(name !== undefined && { name }),
          ...(phone !== undefined && { phone }),
          ...(linkedinUrl !== undefined && { linkedinUrl }),
          ...(githubUrl !== undefined && { githubUrl }),
        } 
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw createError(404, 'not_found', 'User not found');
    }

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        linkedinUrl: user.linkedinUrl,
        githubUrl: user.githubUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
