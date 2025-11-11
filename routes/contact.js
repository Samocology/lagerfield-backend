const express = require('express');
const router = express.Router();
const ContactForm = require('../models/contactForm');

// POST /api/contact - Submit a new contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newContact = new ContactForm({
      name,
      email,
      subject,
      message,
    });

    await newContact.save();
    res.status(201).json({ message: 'Contact form submitted successfully!', contact: newContact });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;