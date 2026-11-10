// models/News.js
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: String,
    content: { type: String, required: true },
    image: String,         // URL (Cloudinary) o dataURI si quisieras (no recomendado)
    date: { type: String, required: true }, // "YYYY-MM-DD" como usabas en el front
    category: String,
    imagePosition: { type: String, default: 'center center' }, // CSS object-position values e.g. 'left top'
    imageFit: { type: String, default: 'cover' }, // 'cover' (crop) or 'contain' (full)
    views: { type: Number, default: 0 } // se incrementa con POST /api/news/:id/view
});

module.exports = mongoose.model('News', NewsSchema);
