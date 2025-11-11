const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  companyInfo: {
    name: { type: String, default: 'Lagerfield Capital' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    contactFormAlerts: { type: Boolean, default: true },
    systemUpdates: { type: Boolean, default: false }
  },
  security: {
    sessionTimeout: { type: Number, default: 30 }, // minutes
    passwordPolicy: { type: String, default: 'medium' },
    twoFactorAuth: { type: Boolean, default: false }
  },
  system: {
    maintenanceMode: { type: Boolean, default: false },
    debugMode: { type: Boolean, default: false },
    apiRateLimit: { type: Number, default: 1000 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one settings document exists
settingsSchema.pre('save', async function(next) {
  const Settings = mongoose.model('Settings', settingsSchema);
  const existing = await Settings.findOne();
  if (existing && existing._id.toString() !== this._id.toString()) {
    throw new Error('Only one settings document is allowed');
  }
  next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
