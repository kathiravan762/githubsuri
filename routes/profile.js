const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Profile = require('../models/Profile');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/profile');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, 'profile-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// PUBLIC - Get profile
router.get('/', async (req, res) => {
  try {
    let profile = await Profile.findOne({});
    if (!profile) {
      profile = await Profile.create({ name: 'Your Name', bio: 'Edit your profile to get started.' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN - Update profile (protected by admin secret in env)
router.put('/', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'backgroundMusic', maxCount: 1 }
]), async (req, res) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { name, bio, tagline, dateOfBirth, musicEnabled, socialLinks } = req.body;
    const update = { name, bio, tagline, musicEnabled: musicEnabled === 'true', updatedAt: new Date() };
    if (dateOfBirth) update.dateOfBirth = new Date(dateOfBirth);
    if (socialLinks) update.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
    if (req.files?.profilePhoto) update.profilePhoto = `/uploads/profile/${req.files.profilePhoto[0].filename}`;
    if (req.files?.backgroundMusic) update.backgroundMusic = `/uploads/profile/${req.files.backgroundMusic[0].filename}`;

    let profile = await Profile.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
