const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Memory = require('../models/Memory');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/memories');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

const adminGuard = (req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// PUBLIC - Get all memories
router.get('/', async (req, res) => {
  try {
    const memories = await Memory.find({}).sort('-date').lean();
    res.json(memories);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUBLIC - Timeline grouped by year
router.get('/timeline', async (req, res) => {
  try {
    const memories = await Memory.find({}).sort('-date').lean();
    const grouped = memories.reduce((acc, m) => {
      const yr = m.year || new Date(m.date).getFullYear();
      if (!acc[yr]) acc[yr] = [];
      acc[yr].push(m);
      return acc;
    }, {});
    const timeline = Object.entries(grouped).sort(([a],[b]) => b-a).map(([year, memories]) => ({ year: parseInt(year), memories }));
    res.json(timeline);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ADMIN - Create memory
router.post('/', adminGuard, upload.single('photo'), async (req, res) => {
  try {
    const { title, description, date, tags, location, mood, aiCaption, color } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Photo required' });
    const memory = new Memory({
      title, description, date: new Date(date),
      photoUrl: `/uploads/memories/${req.file.filename}`,
      tags: tags ? JSON.parse(tags) : [],
      location, mood: mood || 'happy', aiCaption: aiCaption || '',
      color: color || '#9b59ff'
    });
    await memory.save();
    res.status(201).json(memory);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ADMIN - Update
router.put('/:id', adminGuard, async (req, res) => {
  try {
    const memory = await Memory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(memory);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ADMIN - Delete
router.delete('/:id', adminGuard, async (req, res) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Not found' });
    const filePath = path.join(__dirname, '..', memory.photoUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
