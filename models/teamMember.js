const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  socialLinks: {
    type: Map,
    of: String,
    default: {}
  }
});

const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
