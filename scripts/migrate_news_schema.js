require('dotenv').config(); // Load .env from root
const mongoose = require('mongoose');
const News = require('../models/News');

const migrate = async () => {
    // 1. Connect
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is missing in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // 2. Update News
        console.log('⏳ Updating News items...');

        // Update 1: Set default imagePosition if missing
        const resPos = await News.updateMany(
            { imagePosition: { $exists: false } },
            { $set: { imagePosition: 'center center' } }
        );
        console.log(`   👉 Set imagePosition for ${resPos.modifiedCount} items.`);

        // Update 2: Set default imageFit if missing
        const resFit = await News.updateMany(
            { imageFit: { $exists: false } }, // Checks if field is missing
            { $set: { imageFit: 'cover' } }
        );
        console.log(`   👉 Set imageFit for ${resFit.modifiedCount} items.`);

        console.log('✅ Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
