const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');
const Service = require('../models/service');
const TeamMember = require('../models/teamMember');
const ContactForm = require('../models/contactForm');
const mongoose = require('mongoose');
const Visitor = require('../models/visitor');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const mongoose = require('mongoose');

// Platform health check
router.get('/platform-health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Check database connection
    const dbStatus = mongoose.connection.readyState;
    const dbStatusMessage =
      dbStatus === 1 ? 'Connected' :
      dbStatus === 0 ? 'Disconnected' :
      dbStatus === 2 ? 'Connecting' :
      dbStatus === 3 ? 'Disconnecting' : 'Unknown';

    if (dbStatus !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Platform is unhealthy',
        dependencies: {
          database: dbStatusMessage,
        },
      });
    }

    // 2. Check other critical services (e.g., Redis, external APIs) - if any

    // If all checks pass
    res.status(200).json({
      status: 'ok',
      message: 'Platform is healthy',
      dependencies: {
        database: dbStatusMessage,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during health check',
      error: error.message,
    });
  }
});


router.get('/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalInsights, totalServices, totalTeamMembers, totalContactSubmissions] = await Promise.all([
      Insight.countDocuments(),
      Service.countDocuments(),
      TeamMember.countDocuments(),
      ContactForm.countDocuments()
    ]);

    const stats = {
      totalInsights,
      totalServices,
      totalTeamMembers,
      totalContactSubmissions
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recent activity logs
router.get('/activity', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const recentContacts = await ContactForm.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('name email subject timestamp');
    res.json(recentContacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get insights overview data 
router.get('/insights-overview', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const insights = await Insight.find().select('title author date tags');
    const tagCounts = {};
    insights.forEach(insight => {
      insight.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    res.json({
      totalInsights: insights.length,
      tagDistribution: tagCounts,
      recentInsights: insights.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET visitor analytics data
router.get('/analytics/visitors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const query = {};
    
    // Optional date filtering
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [visitors, total] = await Promise.all([
      Visitor.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Visitor.countDocuments(query)
    ]);

    res.json({
      visitors,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST visitor analytics (for recording/tracking)
router.post('/analytics/visitors', async (req, res) => {
  try {
    const visitorData = req.body;
    const visitor = new Visitor(visitorData);
    await visitor.save();
    res.status(201).json({ message: 'Visitor data recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get visitor analytics summary
router.get('/analytics/visitors/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayVisitors = await Visitor.countDocuments({
      timestamp: { $gte: today }
    });

    // Get unique visitors by IP
    const uniqueVisitors = await Visitor.distinct('ip');
    
    // Get top pages
    const topPages = await Visitor.aggregate([
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalVisitors,
      todayVisitors,
      uniqueVisitors: uniqueVisitors.length,
      topPages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;