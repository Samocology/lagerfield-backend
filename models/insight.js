const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: false
  },
  author: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    bio: {
      type: String,
      trim: true
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: false,
    trim: true
  },
  summary: {
    type: String,
    required: false,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  views: {
    type: Number,
    default: 0
  }
});

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;