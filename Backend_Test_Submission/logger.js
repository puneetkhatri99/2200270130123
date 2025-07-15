import axios from 'axios';

export const Log = async (stack, level, pkg, message) => {
  try {
    await axios.post('http://localhost:6000/logs', {
      stack,
      level,
      package: pkg,
      message
    });
  } catch (err) {
    console.error('Logging failed:', err.message);
  }
};