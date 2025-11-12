const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be uploaded to the 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid filename conflicts
  }
});

const upload = multer({ storage: storage });

// Get all insights
router.get('/', async (req, res) => {
  try {
    const insights = await Insight.find().sort({ date: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single insight by ID
router.get('/:id', async (req, res) => {
  try {
    const insight = await Insight.findById(req.params.id);
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
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {
  console.log('Received insight creation request. req.body:', req.body);
  console.log('Received files:', req.files);
  try {
    const { title, content, author, date, tags } = req.body;
    const imageUrl = req.files && req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : '';
    const fileUrl = req.files && req.files['file'] ? `/uploads/${req.files['file'][0].filename}` : '';

    console.log('Extracted fields:');
    console.log('  title:', title);
    console.log('  content:', content);
    console.log('  author:', author);
    console.log('  date:', date);
    console.log('  tags:', tags);
    console.log('  imageUrl:', imageUrl);
    console.log('  fileUrl:', fileUrl);

    const newInsight = new Insight({
      title,
      content,
      author,
      date,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [], // Split tags by comma and trim whitespace
      imageUrl,
      fileUrl
    });
    const savedInsight = await newInsight.save();
    res.status(201).json(savedInsight);
  } catch (error) {
    console.error('Error creating insight:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update an existing insight
router.put('/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, content, author, date, tags } = req.body;
    let imageUrl = req.body.imageUrl; // Keep existing imageUrl if not updated
    let fileUrl = req.body.fileUrl; // Keep existing fileUrl if not updated

        if (req.files && req.files['image']) {
      imageUrl = `/uploads/${req.files['image'][0].filename}`; // Update imageUrl if new image uploaded
         }
        if (req.files && req.files['file']) {
      fileUrl = `/uploads/${req.files['file'][0].filename}`; // Update fileUrl if new file uploaded
    }
    const updatedInsight = await Insight.findByIdAndUpdate(
      req.params.id,
      { title, content, author, date, tags: tags ? tags.split(',').map(tag => tag.trim()) : [], imageUrl, fileUrl},
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