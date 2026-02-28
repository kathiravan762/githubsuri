const express = require('express');
const mongoose = require('mongoose');

const path = require('path');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const memoriesRouter = require('./routes/memories');
console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME);
const profileRouter = require('./routes/profile');
const aiRouter = require('./routes/ai');

const app = express();
app.get("/", (req, res) => {
  res.send("Backend API is Working 🚀");
});
const cors = require("cors");

app.use(cors({
  origin: "https://my-life-memories-frontend.onrender.com",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public API - no authentication required
app.use('/api/memories', memoriesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.post("/api/admin/login", (req, res) => {
  const { secret } = req.body;

  if (secret === process.env.ADMIN_SECRET) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
