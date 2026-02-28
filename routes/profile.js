const express = require('express');
const router = express.Router();
const multer = require('multer');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const Profile = require('../models/Profile');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } 
});

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
    // Upload profile photo
if (req.files?.profilePhoto) {
  const photoFile = req.files.profilePhoto[0];

  const photoUpload = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profile" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(photoFile.buffer);
  });

  update.profilePhoto = photoUpload.secure_url;
}

// Upload background music
if (req.files?.backgroundMusic) {
  const musicFile = req.files.backgroundMusic[0];

  const musicUpload = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profile_music", resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(musicFile.buffer);
  });

  update.backgroundMusic = musicUpload.secure_url;
}

    let profile = await Profile.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
