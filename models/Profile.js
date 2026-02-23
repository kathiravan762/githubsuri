const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String, default: 'Your Name' },
  dateOfBirth: { type: Date },
  bio: { type: String, default: '' },
  tagline: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  backgroundMusic: { type: String, default: '' },
  musicEnabled: { type: Boolean, default: false },
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String,
    email: String,
  },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Profile', profileSchema);
