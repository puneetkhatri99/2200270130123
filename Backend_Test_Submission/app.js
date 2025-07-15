import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { Log } from './logger.js'; 

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));


const urls = new Map();


app.post('/shorturls', async (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  await Log('backend', 'info', 'create-url', `Incoming POST /shorturls with body: ${JSON.stringify(req.body)}`);

  if (!url || typeof url !== 'string') {
    await Log('backend', 'error', 'create-url', 'Invalid or missing URL');
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  const code = shortcode || nanoid(6);
  const shortLink = `http://localhost:5000/${code}`;

  if (urls.has(code)) {
    await Log('backend', 'warn', 'create-url', `Duplicate shortcode: ${code}`);
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

  await Log('backend', 'info', 'create-url', `Short URL created: ${shortLink} (expires at ${expiry})`);

  return res.status(201).json({ shortLink, expiry });
});


app.get('/:shortcode', async (req, res) => {
  const code = req.params.shortcode;
  const record = urls.get(code);

  if (!record) {
    await Log('backend', 'error', 'redirect', `Shortcode not found: ${code}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

  if (dayjs().isAfter(record.expiry)) {
    await Log('backend', 'warn', 'redirect', `Expired link accessed: ${code}`);
    return res.status(410).json({ error: 'Link expired' });
  }

  record.totalClicks++;
  record.clickData.push({
    timestamp: new Date().toISOString(),
    source: req.get('referer') || 'direct',
    ip: req.ip
  });

  await Log('backend', 'info', 'redirect', `Redirecting shortcode: ${code} to ${record.originalUrl}`);

  return res.redirect(record.originalUrl);
});


app.get('/shorturls/:shortcode', async (req, res) => {
  const code = req.params.shortcode;
  const record = urls.get(code);

  await Log('backend', 'info', 'stats', `Stats requested for: ${code}`);

  if (!record) {
    await Log('backend', 'error', 'stats', `Shortcode not found: ${code}`);
    return res.status(404).json({ error: 'Shortcode not found' });
  }

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
app.listen(PORT, async () => {
  console.log(`URL Shortener running at http://localhost:${PORT}`);
});