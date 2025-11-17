const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const TeamMember = require('../models/teamMember');

// Configure multer for file uploads with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lagerfield/team',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept image files only
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all team members
router.get('/', async (req, res) => {
  try {
    console.log('Fetching team members...');
    const teamMembers = await TeamMember.find();
    console.log('Team members fetched:', teamMembers.length);
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new team member with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, title, email, bio, socialLinks } = req.body;
    
    // Validate required fields
    if (!name || !title) {
      return res.status(400).json({ message: 'Name and title are required' });
    }

    // Use Cloudinary URL
    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
    }

    const newTeamMember = new TeamMember({
      name,
      title,
      email,
      bio,
      imageUrl,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {}
    });

    const savedTeamMember = await newTeamMember.save();
    res.status(201).json(savedTeamMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an existing team member
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, title, email, bio, imageUrl, socialLinks } = req.body;
    
    // Build update object
    const updateData = {
      name,
      title,
      email,
      bio,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : undefined
    };

    // If a new image is uploaded, use it; otherwise keep existing imageUrl or use provided one
    if (req.file) {
      updateData.imageUrl = req.file.path;
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (updatedTeamMember) {
      res.json(updatedTeamMember);
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a team member
router.delete('/:id', async (req, res) => {
  try {
    const teamMember = await TeamMember.findByIdAndDelete(req.params.id);
    if (teamMember) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
