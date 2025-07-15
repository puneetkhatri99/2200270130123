// urlShortenerService.js
import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';

const app = express();
app.use(express.json());

app.use(cors());

// In-memory store (mock DB)
const urls = new Map();
const clicks = new Map();

// POST: Create Short URL
app.post('/shorturls', (req, res) => {
    console.log('Received request to create short URL:', req.body);
  const { url, validity = 30, shortcode } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  const code = shortcode || nanoid(6);
  const shortLink = `http://localhost:5000/${code}`;

  if (urls.has(code)) {
    return res.status(409).json({ error: 'Shortcode already exists' });
  }

  const expiry = dayjs().add(validity, 'minute').toISOString();
  const now = dayjs().toISOString();

  urls.set(code, {
    originalUrl: url,
    shortLink,
    createdAt: now,
    expiry,
    totalClicks: 0,
    clickData: []
  });

  return res.status(201).json({ shortLink, expiry });
});

// GET: Redirect to original URL
app.get('/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const record = urls.get(code);

  if (!record) return res.status(404).json({ error: 'Shortcode not found' });

  if (dayjs().isAfter(record.expiry)) {
    return res.status(410).json({ error: 'Link expired' });
  }

  record.totalClicks++;
  record.clickData.push({
    timestamp: new Date().toISOString(),
    source: req.get('referer') || 'direct',
    ip: req.ip
  });

  return res.redirect(record.originalUrl);
});

// GET: Stats for short URL
app.get('/shorturls/:shortcode', (req, res) => {
  const code = req.params.shortcode;
  const record = urls.get(code);

  if (!record) return res.status(404).json({ error: 'Shortcode not found' });

  return res.json({
    shortUrl: record.shortLink,
    originalUrl: record.originalUrl,
    createdAt: record.createdAt,
    expiresAt: record.expiry,
    totalClicks: record.totalClicks,
    lastClickTimestamp: record.clickData.at(-1)?.timestamp || null,
    lastClickSource: record.clickData.at(-1)?.source || null,
    clickLog: record.clickData
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`URL Shortener running at http://localhost:${PORT}`));