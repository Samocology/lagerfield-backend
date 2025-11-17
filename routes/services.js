const express = require('express');
const router = express.Router();
const Service = require('../models/service');

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single service by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    let service;
    // Try to find by ID first
    if (req.params.idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      service = await Service.findById(req.params.idOrSlug);
    }
    // If not found by ID, try by slug
    if (!service) {
      service = await Service.findOne({ slug: req.params.idOrSlug });
    }
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new service
router.post('/', async (req, res) => {
  try {
    const { name, description, slug, icon, imageUrl } = req.body;

    // Basic validation for required fields
    if (!name) {
      return res.status(400).json({ message: 'Service name is required.' });
    }
    if (!description) {
      return res.status(400).json({ message: 'Service description is required.' });
    }
    if (!slug) {
      return res.status(400).json({ message: 'Service slug is required.' });
    }

    const newService = new Service({
      name,
      description,
      slug,
      icon,
      imageUrl
    });
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Service slug must be unique' });
    } else {
      // Mongoose validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ message: errors.join(', ') });
      }
      res.status(400).json({ message: error.message });
    }
  }
});

// Update an existing service
router.put('/:id', async (req, res) => {
  try {
    const { name, description, slug, icon, imageUrl } = req.body;
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { name, description, slug, icon, imageUrl },
      { new: true, runValidators: true }
    );
    if (updatedService) {
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Service slug must be unique' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete a service
router.delete('/:id', async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (deletedService) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
