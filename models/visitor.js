const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  page: {
    type: String,
    required: true,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  }
});

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
