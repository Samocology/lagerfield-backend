console.log('Current working directory:', process.cwd());
require('dotenv').config({ path: './.env' });
console.log('MONGO_URI:', process.env.MONGO_URI);
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const connectDB = require('./db');

const insightsRouter = require('./routes/insights');
const servicesRouter = require('./routes/services');
const teamRouter = require('./routes/team');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');

// Connect to database
connectDB();

app.use(express.json()); // For parsing application/json
app.use(express.static('uploads')); // Serve uploaded files

// Enable CORS for all routes
app.use((req, res, next) => {
  console.log('CORS middleware executed for:', req.method, req.url); // Debugging line
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Intercepts OPTIONS method
  if (req.method === 'OPTIONS') {
    // Pre-flight request. Reply successfully:
    res.sendStatus(204);
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.send('Lagerfield Capital Backend is running!');
});

app.use('/api/insights', insightsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/team', teamRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
