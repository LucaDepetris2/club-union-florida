// models/News.js
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: String,
    content: { type: String, required: true },
    image: String,         // URL (Cloudinary) o dataURI si quisieras (no recomendado)
    date: { type: String, required: true }, // "YYYY-MM-DD" como usabas en el front
    category: String
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
