import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Food Craft API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mock Scan Ingredients endpoint (can be connected to a real model)
app.post('/api/scan', (req, res) => {
  const { ingredients } = req.body;
  res.json({
    success: true,
    message: 'Ingredients received successfully',
    detectedCount: ingredients ? ingredients.length : 0,
    timestamp: new Date().toISOString(),
  });
});

// Serve built frontend assets from 'dist'
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all route to serve index.html for client-side routing (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Food Craft Server running on port ${PORT}`);
  console.log(`📱 Local URL: http://localhost:${PORT}`);
});
