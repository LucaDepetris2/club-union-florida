require('dotenv').config();
const mongoose = require('mongoose');
const News = require('../models/News');

async function migrate() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('No MONGODB_URI found. Make sure .env is present in root.');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB.');

        const filter = {
            $or: [
                { imagePosition: { $exists: false } },
                { imageFit: { $exists: false } }
            ]
        };

        const update = {
            $set: {
                imagePosition: 'center center',
                imageFit: 'cover'
            }
        };

        const result = await News.updateMany(filter, update);
        console.log(`Migration complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

migrate();
