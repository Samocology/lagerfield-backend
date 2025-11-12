const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
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
