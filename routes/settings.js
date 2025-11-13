const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get current settings
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update settings
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    settings.updatedAt = new Date();
    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload profile image
router.post('/upload-profile-image', authenticateToken, requireAdmin, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // In a real app, you'd save the file path to user profile, but for now we'll just return the path
    const imageUrl = `/api/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user profile (placeholder - in real app, this would be from a User model)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Placeholder response - in real app, get from User model
    const profile = {
      name: 'Admin User',
      email: 'admin@lagerfieldcapital.com',
      role: 'Administrator',
      avatarUrl: null,
      lastLogin: new Date()
    };
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile (placeholder)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    // Placeholder - in real app, update User model
    const updatedProfile = {
      name: name || 'Admin User',
      email: email || 'admin@lagerfieldcapital.com',
      role: 'Administrator',
      avatarUrl,
      lastLogin: new Date()
    };
    res.json(updatedProfile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Change password (placeholder)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // Placeholder - in real app, verify current password and update
    // For now, just return success
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
