require('dotenv').config({ path: './.env' });

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const connectDB = require('./db');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ROUTES
const insightsRouter = require('./routes/insights');
const servicesRouter = require('./routes/services');
const teamRouter = require('./routes/team');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const settingsRouter = require('./routes/settings');
const authRouter = require('./routes/auth');

// DB CONNECTION
connectDB();

// CORS CONFIG 
const allowedOrigins = [
  'http://localhost:8080',
  'https://lagerfield.vercel.app',
  'https://www.lagerfieldcapital.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// MIDDLEWARE
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Parse JSON requests
app.use(express.json());

// Static files
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ROUTES MOUNTING
app.use('/api/insights', insightsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/team', teamRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);

// BASE ROUTE
app.get('/', (req, res) => {
  res.send('Lagerfield Capital Backend is running!');
});

// ERROR HANDLING MIDDLEWARE 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// START SERVER
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

