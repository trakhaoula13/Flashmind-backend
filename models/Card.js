const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
    front: { type: String, required: [true, 'Le recto est obligatoire'], trim: true, maxlength: 1000 },
    back: { type: String, required: [true, 'Le verso est obligatoire'], trim: true, maxlength: 2000 },
    color: { type: String, default: '#10A5A0' },
    tags: { type: [String], default: [] },

    // Planification
    dueAt: { type: Date, default: Date.now },
    intervalDays: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    lapses: { type: Number, default: 0 },
    lastRating: { type: String, enum: ['again', 'hard', 'medium', 'easy', null], default: null },
    lastReviewedAt: { type: Date, default: null },
    firstReviewedAt: { type: Date, default: null }, // jour où la carte a été découverte
  },
  { timestamps: true }
);

cardSchema.index({ user: 1, folder: 1, dueAt: 1 });

module.exports = mongoose.model('Card', cardSchema);
