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
    type: String,
    required: true,
    trim: true
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
  }
});

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;
