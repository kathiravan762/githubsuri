const express = require('express');
const router = express.Router();
const Memory = require('../models/Memory');

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.content[0].text;
}

router.post('/caption', async (req, res) => {
  try {
    const { title, description, date, mood, location } = req.body;
    const caption = await callClaude(
      `Write a short, poetic, emotional caption (2-3 sentences) for this personal photo memory:
Title: ${title}
Date: ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Description: ${description || 'No description'}
Mood: ${mood} | Location: ${location || 'unknown'}
Make it heartfelt, nostalgic, and deeply personal.`
    );
    res.json({ caption: caption.trim() });
  } catch (err) {
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

router.post('/life-story', async (req, res) => {
  try {
    const memories = await Memory.find({}).sort('date').lean();
    if (!memories.length) return res.json({ story: 'Add some memories to generate your life story.' });
    const summaries = memories.map(m => `[${new Date(m.date).getFullYear()}] ${m.title}: ${m.description || m.aiCaption || 'A special moment'}`).join('\n');
    const story = await callClaude(
      `Based on these personal life memories, write a beautiful, emotional autobiographical narrative (4-5 paragraphs). Write in first-person, with warmth, nostalgia, and literary elegance.\n\n${summaries}`
    );
    res.json({ story: story.trim() });
  } catch (err) {
    res.status(500).json({ message: 'AI error', error: err.message });
  }
});

module.exports = router;
