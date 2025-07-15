import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Grid, Paper, Box, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import axios from 'axios';

const UrlShortener = () => {
  const [urls, setUrls] = useState([{ originalUrl: '', validity: '', shortcode: '' }]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState([]);

  const handleChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const validateUrl = (url) => {
    const pattern = /^(http|https):\/\/[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:\/?#\[\]@!$&'()*+,;=.]+$/;
    return pattern.test(url);
  };

  const handleSubmit = async () => {
    const validated = urls.every(url =>
      validateUrl(url.originalUrl) &&
      (url.validity === '' || !isNaN(url.validity))
    );

    if (!validated) {
      alert('Validation failed: Make sure all URLs are valid and validity (if present) is a number.');
      return;
    }

    try {
      const promises = urls.map(url => {
        return axios.post('http://localhost:5000/shorturls', {
          url: url.originalUrl,
          validity: url.validity ? parseInt(url.validity) : undefined,
          shortcode: url.shortcode || undefined
        },
      // {
      //   withCredentials: true
      // }
    );
      });
      const responses = await Promise.all(promises);
      const data = responses.map(res => res.data);
      setResults(data);
    } catch (err) {
      console.error(err);
      alert('Error while shortening URLs');
    }
  };

  const fetchStats = async () => {
    try {
      const shortcode = prompt('Enter shortcode to fetch stats:');
      if (!shortcode) return;
      const res = await axios.get(`http://localhost:5000/shorturls/${shortcode}`);
      setStats([res.data]);
    } catch (err) {
      console.error(err);
      alert('Error fetching stats');
    }
  };

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { originalUrl: '', validity: '', shortcode: '' }]);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>URL Shortener</Typography>
      {urls.map((url, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid size ={{ xs:12 ,sm:6}}>
              <TextField
                label="Original URL"
                fullWidth
                value={url.originalUrl}
                onChange={(e) => handleChange(index, 'originalUrl', e.target.value)}
              />
            </Grid>
            <Grid size ={{ xs:12 ,sm:3}}>
              <TextField
                label="Validity (min)"
                fullWidth
                value={url.validity}
                onChange={(e) => handleChange(index, 'validity', e.target.value)}
              />
            </Grid>
            <Grid size ={{ xs:12 ,sm:3}}>
              <TextField
                label="Shortcode (optional)"
                fullWidth
                value={url.shortcode}
                onChange={(e) => handleChange(index, 'shortcode', e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Box mb={2}>
        <Button variant="outlined" onClick={addUrlField} disabled={urls.length >= 5}>
          Add Another URL
        </Button>
      </Box>
      <Button variant="contained" onClick={handleSubmit}>
        Shorten URLs
      </Button>

      <Box mt={4}>
        <Typography variant="h6">Results</Typography>
        {results.map((res, index) => (
          <Paper key={index} sx={{ p: 2, mt: 2 }}>
            <Typography><strong>Shortened:</strong> {res.shortLink}</Typography>
            <Typography><strong>Expires at:</strong> {res.expiry}</Typography>
          </Paper>
        ))}
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h5" gutterBottom>URL Shortener Statistics</Typography>
        <Button variant="outlined" onClick={fetchStats} sx={{ mb: 2 }}>Load Statistics</Button>

        {stats.length > 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Short URL</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Expires At</TableCell>
                <TableCell>Total Clicks</TableCell>
                <TableCell>Click Timestamp</TableCell>
                <TableCell>Click Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.map((s, index) => (
                <TableRow key={index}>
                  <TableCell>{s.shortUrl}</TableCell>
                  <TableCell>{s.createdAt}</TableCell>
                  <TableCell>{s.expiresAt || '∞'}</TableCell>
                  <TableCell>{s.totalClicks}</TableCell>
                  <TableCell>{s.lastClickTimestamp || '-'}</TableCell>
                  <TableCell>{s.lastClickSource || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </Container>
  );
};

export default UrlShortener;