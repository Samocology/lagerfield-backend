const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');

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
router.post('/', async (req, res) => {
  try {
    const { title, content, author, date, tags, imageUrl } = req.body;
    const newInsight = new Insight({
      title,
      content,
      author,
      date,
      tags,
      imageUrl
    });
    const savedInsight = await newInsight.save();
    res.status(201).json(savedInsight);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an existing insight
router.put('/:id', async (req, res) => {
  try {
    const { title, content, author, date, tags, imageUrl } = req.body;
    const updatedInsight = await Insight.findByIdAndUpdate(
      req.params.id,
      { title, content, author, date, tags, imageUrl },
      { new: true, runValidators: true }
    );
    if (updatedInsight) {
      res.json(updatedInsight);
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
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
