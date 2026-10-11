const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Le nom du dossier est obligatoire'], trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    color: { type: String, default: '#10A5A0' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Folder', folderSchema);
