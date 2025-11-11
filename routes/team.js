const express = require('express');
const router = express.Router();
const TeamMember = require('../models/teamMember');

// Get all team members
router.get('/', async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    res.json(teamMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new team member
router.post('/', async (req, res) => {
  try {
    const { name, title, bio, imageUrl, socialLinks } = req.body;
    const newTeamMember = new TeamMember({
      name,
      title,
      bio,
      imageUrl,
      socialLinks
    });
    const savedTeamMember = await newTeamMember.save();
    res.status(201).json(savedTeamMember);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an existing team member
router.put('/:id', async (req, res) => {
  try {
    const { name, title, bio, imageUrl, socialLinks } = req.body;
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { name, title, bio, imageUrl, socialLinks },
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
    const deletedTeamMember = await TeamMember.findByIdAndDelete(req.params.id);
    if (deletedTeamMember) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
