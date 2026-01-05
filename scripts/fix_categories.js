require('dotenv').config({ path: '../.env' }); // Adjust path if needed, assuming run from root or scripts/
// If run from root, just .config()
const mongoose = require('mongoose');
const News = require('../models/News');

const MAPPING = {
    // Normalizing specific duplicates/variations
    'Liga Formativa U11': 'U11',
    'Liga Federal Formativa U21': 'U21',
    'LIGA FEDERAL FORMATIVA U21': 'U21', // Added missing mapping
    'LIGA FEDERAL FORMATIVA U15': 'U15', // Added missing mapping
    'Liga Federal Formativa U15': 'U15',
    'Liga Federal Formativa u11': 'U11', // Added specific case
    'Liga Federal Formativa U11': 'U11',
    'Liga Nacional': 'PRIMERA',
    'LIGA NACIONAL': 'PRIMERA',
    'U10': 'U11', // As discussed, mapping U10 to U11
    'u10': 'U11',
    'u11': 'U11',
    'u12': 'U12',
    'u13': 'U13',
    'u15': 'U15',
    'u17': 'U17',
    'u21': 'U21',
    'primera': 'PRIMERA',
    'Primera': 'PRIMERA',
    'liga femenina': 'LIGA FEMENINA',
    'Liga Femenina': 'LIGA FEMENINA',
    'LIGA FEMENINA ': 'LIGA FEMENINA' // Trim check
};

const ALLOWED_CATEGORIES = [
    'LIGA FEMENINA', 'PRIMERA', 'U21', 'U17', 'U15', 'U13', 'U12', 'U11'
];

async function fixCategories() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI missing in environment variables');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const newsItems = await News.find({});
        console.log(`Found ${newsItems.length} news items.`);

        let updatedCount = 0;

        for (const item of newsItems) {
            let originalCat = item.category ? item.category.trim() : '';
            let newCat = originalCat;

            // Direct mapping
            if (MAPPING[originalCat]) {
                newCat = MAPPING[originalCat];
            }
            // Case insensitive check if not in mapping directly
            else {
                // Try to find if uppercase version works or partial matches if needed (but explicit is safer)
                // For now, let's just UPPERCASE if it matches one of our allowed ones case-insensitively
                const upper = originalCat.toUpperCase();
                if (ALLOWED_CATEGORIES.includes(upper)) {
                    newCat = upper;
                }
            }

            if (newCat !== originalCat) {
                console.log(`Build: "${originalCat}" -> "${newCat}"`);
                item.category = newCat;
                await item.save();
                updatedCount++;
            } else if (!ALLOWED_CATEGORIES.includes(newCat)) {
                console.warn(`⚠️ Warning: Category "${originalCat}" is not in the allowed list and no mapping was found.`);
            }
        }

        console.log(`\n✅ Finished! Updated ${updatedCount} items.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixCategories();
