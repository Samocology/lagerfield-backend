const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TeamMember = require('../models/teamMember');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomId-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept image files only
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
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
    const teamMembers = await TeamMember.find();
    res.json(teamMembers);
  } catch (error) {
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

    // Generate image URL (relative path that frontend can resolve)
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
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
    // Clean up uploaded file if there's a database error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
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
      updateData.imageUrl = `/uploads/${req.file.filename}`;
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
    // Clean up uploaded file if there's an error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete a team member
router.delete('/:id', async (req, res) => {
  try {
    const teamMember = await TeamMember.findByIdAndDelete(req.params.id);
    if (teamMember) {
      // Clean up the image file if it exists
      if (teamMember.imageUrl) {
        const filePath = path.join(__dirname, '../uploads', path.basename(teamMember.imageUrl));
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Error deleting file:', err);
          }
        });
      }
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
