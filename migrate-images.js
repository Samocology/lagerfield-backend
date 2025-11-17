require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const cloudinary = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

// Models
const TeamMember = require('./models/teamMember');
const Insight = require('./models/insight');
const Settings = require('./models/settings');

async function migrateImages() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    const models = [
      { model: TeamMember, field: 'imageUrl', folder: 'lagerfield/team' },
      { model: Insight, field: 'imageUrl', folder: 'lagerfield/insights' },
      { model: Settings, field: 'profileImageUrl', folder: 'lagerfield/settings' } // Assuming settings has profileImageUrl
    ];

    for (const { model, field, folder } of models) {
      const documents = await model.find({ [field]: { $regex: '^/api/uploads/' } });
      console.log(`Found ${documents.length} documents in ${model.modelName} with local URLs`);

      for (const doc of documents) {
        const localPath = path.join(__dirname, 'uploads', path.basename(doc[field]));
        if (fs.existsSync(localPath)) {
          try {
            const result = await cloudinary.uploader.upload(localPath, { folder });
            doc[field] = result.secure_url;
            await doc.save();
            console.log(`Migrated ${model.modelName} ${doc._id}: ${result.secure_url}`);
            // Optionally delete local file
            fs.unlinkSync(localPath);
          } catch (uploadError) {
            console.error(`Failed to upload ${localPath}:`, uploadError);
          }
        } else {
          console.log(`Local file not found: ${localPath}`);
        }
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateImages();
