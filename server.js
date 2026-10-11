require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'flashmind-api' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/folders', require('./routes/folderRoutes'));
app.use('/api/cards', require('./routes/cardRoutes'));
app.use('/api/study', require('./routes/studyRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API FlashMind prête sur http://localhost:${PORT}`));
});
