const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');


// Custom Cloudinary storage that switches based on field name
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    if (file.fieldname === 'image') {
      return {
        folder: 'lagerfield/insights/images',
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
      };
    } else if (file.fieldname === 'file') {
      return {
        folder: 'lagerfield/insights/files',
        allowed_formats: ['pdf', 'mp4', 'jpeg', 'jpg', 'png', 'gif', 'webp'],
        resource_type: 'auto',
        access_mode: 'public'
      };
    }
  }
});

const upload = multer({ storage: storage });

// Get all insights
router.get('/', async (req, res) => {
  try {
    const insights = await Insight.find().sort({ date: -1 });
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single insight by ID
router.get('/:id', async (req, res) => {

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const insight = await Insight.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (insight) {
      res.json(insight);
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new insight
router.post('/', upload.any(), async (req, res) => {
  try {
    const { title, body, date, tags, category, summary } = req.body;
    let author = req.body.author;

    // The author object might be stringified if sent via multipart/form-data
    if (author && typeof author === 'string') {
      try {
        author = JSON.parse(author);
      } catch (e) {
        // Fallback for plain string author for backward compatibility
        author = { name: author };
      }
    }

    const imageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const fileFile = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    
    // Clean the URL from Cloudinary before saving
    const imageUrl = imageFile ? imageFile.path.replace(/`/g, '').trim() : '';
    const fileUrl = fileFile ? fileFile.path.replace(/`/g, '').trim() : '';

    const newInsight = new Insight({
      title,
      body,
      author,
      date,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [], // Split tags by comma and trim whitespace
      category,
      summary,
      imageUrl,
      fileUrl
    });
    const savedInsight = await newInsight.save();
    res.status(201).json(savedInsight);
  } catch (error) {
    console.error('Error creating insight:', error);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(400).json({ message: error.message });
  }
});

// Update an existing insight
router.put('/:id', upload.any(), async (req, res) => {
  try {
    const { title, body, date, tags, category, summary } = req.body;
    let author = req.body.author;

    // The author object might be stringified if sent via multipart/form-data
    if (author && typeof author === 'string') {
      try {
        author = JSON.parse(author);
      } catch (e) {
        // Fallback for plain string author for backward compatibility
        author = { name: author };
      }
    }

    let imageUrl = req.body.imageUrl; // Keep existing imageUrl if not updated
    let fileUrl = req.body.fileUrl; // Keep existing fileUrl if not updated

    const imageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const fileFile = req.files ? req.files.find(f => f.fieldname === 'file') : null;

    // Clean the URL from Cloudinary before saving
    if (imageFile) {
      imageUrl = imageFile.path.replace(/`/g, '').trim();
    }
    if (fileFile) {
      fileUrl = fileFile.path.replace(/`/g, '').trim();
    }

    const updatedInsight = await Insight.findByIdAndUpdate(
      req.params.id,
      { title, body, author, date, tags: tags ? tags.split(',').map(tag => tag.trim()) : [], category, summary, imageUrl, fileUrl},
      { new: true, runValidators: true }
    );
    if (updatedInsight) {
      res.json(updatedInsight);
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an insight
router.delete('/:id', async (req, res) => {
  try {
    const deletedInsight = await Insight.findByIdAndDelete(req.params.id);
    if (deletedInsight) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;