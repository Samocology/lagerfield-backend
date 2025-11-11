const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  icon: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  }
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
