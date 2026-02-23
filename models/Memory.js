const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  year: { type: Number },
  photoUrl: { type: String, required: true },
  aiCaption: { type: String, default: '' },
  tags: [String],
  location: { type: String, default: '' },
  mood: { type: String, default: 'happy' },
  isFavorite: { type: Boolean, default: false },
  color: { type: String, default: '#9b59ff' },
  createdAt: { type: Date, default: Date.now }
});

memorySchema.pre('save', function(next) {
  if (this.date) this.year = new Date(this.date).getFullYear();
  next();
});

module.exports = mongoose.model('Memory', memorySchema);
