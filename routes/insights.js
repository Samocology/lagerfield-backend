const express = require('express');
const router = express.Router();
const Insight = require('../models/insight');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Custom Cloudinary storage that switches based on field name
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'image') {
      return {
        folder: 'lagerfield/insights/images',
        allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
      };
    } else if (file.fieldname === 'file') {
      // Extract filename without extension and extension separately
      const fileNameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
      const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.') + 1);
      
      return {
        folder: 'lagerfield/insights/files',
        allowed_formats: ['pdf', 'mp4', 'jpeg', 'jpg', 'png', 'gif', 'webp'],
        resource_type: 'raw',
        access_mode: 'public',
        // CRITICAL: Set the public_id to include the extension
        // This ensures Cloudinary keeps the extension in the URL
        public_id: `${Date.now()}-${fileNameWithoutExt}.${fileExtension}`,
        // OR simply use the original filename with a timestamp prefix
        // public_id: `${Date.now()}-${file.originalname}`,
        format: fileExtension // Explicitly set the format
      };
    }
  }
});

const upload = multer({ storage: storage });

// Helper function to ensure Cloudinary URL ends with the correct extension
function ensureFileExtension(url, originalFilename) {
  if (!url || !originalFilename) return url;
  
  // Get the file extension from original filename
  const fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
  
  // If URL already ends with the extension, return as is
  if (url.toLowerCase().endsWith(`.${fileExtension}`)) {
    return url;
  }
  
  // If URL has a different extension, replace it
  const lastDotIndex = url.lastIndexOf('.');
  if (lastDotIndex > url.lastIndexOf('/')) {
    // URL has an extension, replace it
    return url.substring(0, lastDotIndex) + `.${fileExtension}`;
  }
  
  // No extension found, append it
  return `${url}.${fileExtension}`;
}

// ============ PUBLIC ROUTES (No Authentication Required) ============

// Get all insights - PUBLIC
router.get('/', async (req, res) => {
  try {
    const insights = await Insight.find().sort({ date: -1 });
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single insight by ID - PUBLIC
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    const insight = await Insight.findByIdAndUpdate(
      req.params.id, 
      { $inc: { views: 1 } }, 
      { new: true }
    );
    
    if (insight) {
      res.json(insight);
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ PROTECTED/ADMIN ROUTES (Authentication Required) ============

// Create a new insight - ADMIN ONLY
router.post('/', authenticateToken, requireAdmin, upload.any(), async (req, res) => {
  try {
    const { title, body, date, tags, category, summary } = req.body;
    let author = req.body.author;

    // The author object might be stringified if sent via multipart/form-data
    if (author && typeof author === 'string') {
      try {
        author = JSON.parse(author);
      } catch (e) {
        // Fallback for plain string author for backward compatibility
        author = { name: author };
      }
    }

    const imageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const fileFile = req.files ? req.files.find(f => f.fieldname === 'file') : null;
    
    // Process file URLs with proper extension handling
    const imageUrl = imageFile ? imageFile.path.replace(/`/g, '').trim() : '';
    let fileUrl = '';
    
    if (fileFile) {
      // Clean the URL first
      const cleanedUrl = fileFile.path.replace(/`/g, '').trim();
      // Ensure the URL has the correct file extension
      fileUrl = ensureFileExtension(cleanedUrl, fileFile.originalname);
    }

    const newInsight = new Insight({
      title,
      body,
      author,
      date,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      category,
      summary,
      imageUrl,
      fileUrl
    });
    
    const savedInsight = await newInsight.save();
    res.status(201).json(savedInsight);
  } catch (error) {
    console.error('Error creating insight:', error);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    res.status(400).json({ message: error.message });
  }
});

// Update an existing insight - ADMIN ONLY
router.put('/:id', authenticateToken, requireAdmin, upload.any(), async (req, res) => {
  try {
    const { title, body, date, tags, category, summary } = req.body;
    let author = req.body.author;

    // The author object might be stringified if sent via multipart/form-data
    if (author && typeof author === 'string') {
      try {
        author = JSON.parse(author);
      } catch (e) {
        // Fallback for plain string author for backward compatibility
        author = { name: author };
      }
    }

    let imageUrl = req.body.imageUrl; // Keep existing imageUrl if not updated
    let fileUrl = req.body.fileUrl; // Keep existing fileUrl if not updated

    const imageFile = req.files ? req.files.find(f => f.fieldname === 'image') : null;
    const fileFile = req.files ? req.files.find(f => f.fieldname === 'file') : null;

    // Clean the URL from Cloudinary before saving
    if (imageFile) {
      imageUrl = imageFile.path.replace(/`/g, '').trim();
    }
    
    if (fileFile) {
      // Clean the URL and ensure proper extension
      const cleanedUrl = fileFile.path.replace(/`/g, '').trim();
      fileUrl = ensureFileExtension(cleanedUrl, fileFile.originalname);
    }

    const updatedInsight = await Insight.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        body, 
        author, 
        date, 
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [], 
        category, 
        summary, 
        imageUrl, 
        fileUrl
      },
      { new: true, runValidators: true }
    );
    
    if (updatedInsight) {
      res.json(updatedInsight);
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an insight - ADMIN ONLY
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedInsight = await Insight.findByIdAndDelete(req.params.id);
    if (deletedInsight) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'Insight not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Utility endpoint to fix existing PDF URLs in database
router.post('/fix-pdf-urls', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const insights = await Insight.find({ fileUrl: { $regex: /\.pdf$/i, $options: 'i' } });
    let fixedCount = 0;
    
    for (const insight of insights) {
      // Check if URL needs fixing
      if (!insight.fileUrl.toLowerCase().endsWith('.pdf')) {
        const oldUrl = insight.fileUrl;
        // Add .pdf extension if missing
        insight.fileUrl = insight.fileUrl + '.pdf';
        await insight.save();
        fixedCount++;
        console.log(`Fixed URL: ${oldUrl} -> ${insight.fileUrl}`);
      }
    }
    
    res.json({ 
      message: `Fixed ${fixedCount} PDF URLs`,
      totalChecked: insights.length 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;