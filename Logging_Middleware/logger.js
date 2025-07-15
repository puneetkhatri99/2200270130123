import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());    
app.use(express.json());

const LOG_ENDPOINT = 'http://20.244.56.144/evaluation-service/logs';
const BEARER_TOKEN = "";

app.post('/logs', async (req, res) => {
  const { stack, level, package: pkg, message } = req.body;
  console.log(`[${level}] [${stack}] [${pkg}]: ${message}`);
try {
    await axios.post( LOG_ENDPOINT,
      {
        stack,
        level,
        package: pkg,
        message
      },
      {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
  } catch (err) {
    console.error('Logging failed:', err.message);
  }

});

app.listen(6000, () => {
  console.log('Logging middleware running on port 6000');
});