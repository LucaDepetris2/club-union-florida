// models/Player.js
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String, required: true },
    image: String        // URL (Cloudinary)
}, { timestamps: true });

module.exports = mongoose.model('Player', PlayerSchema);
