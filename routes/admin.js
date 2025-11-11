const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');
const Service = require('../models/service');
const TeamMember = require('../models/teamMember');
const ContactForm = require('../models/contactForm');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get aggregated statistics for the admin dashboard
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

// Get recent activity logs (last 10 contact submissions)
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

// Get insights overview data (for charts)
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

module.exports = router;
