const Folder = require('../models/Folder');
const Card = require('../models/Card');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError, normalizeTags, normalizeColor } = require('../utils/helpers');
const { schedule } = require('../utils/scheduler');

const RATINGS = ['again', 'hard', 'medium', 'easy'];

async function ownedFolder(userId, folderId) {
  const folder = await Folder.findOne({ _id: folderId, user: userId });
  if (!folder) throw new HttpError(404, 'Dossier introuvable');
  return folder;
}

exports.listByFolder = asyncHandler(async (req, res) => {
  await ownedFolder(req.user._id, req.params.folderId);
  const cards = await Card.find({ folder: req.params.folderId, user: req.user._id }).sort({ createdAt: -1 });
  res.json(cards);
});

exports.createInFolder = asyncHandler(async (req, res) => {
  const folder = await ownedFolder(req.user._id, req.params.folderId);
  const { front, back, color, tags } = req.body;
  if (!front || !String(front).trim()) throw new HttpError(400, 'Le recto est obligatoire');
  if (!back || !String(back).trim()) throw new HttpError(400, 'Le verso est obligatoire');

  const card = await Card.create({
    user: req.user._id,
    folder: folder._id,
    front: String(front).trim(),
    back: String(back).trim(),
    color: normalizeColor(color, folder.color),
    tags: normalizeTags(tags),
    dueAt: new Date(),
  });
  await Folder.updateOne({ _id: folder._id }, { $set: { updatedAt: new Date() } });
  res.status(201).json(card);
});

exports.update = asyncHandler(async (req, res) => {
  const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
  if (!card) throw new HttpError(404, 'Carte introuvable');

  const { front, back, color, tags } = req.body;
  if (front !== undefined) {
    if (!String(front).trim()) throw new HttpError(400, 'Le recto est obligatoire');
    card.front = String(front).trim();
  }
  if (back !== undefined) {
    if (!String(back).trim()) throw new HttpError(400, 'Le verso est obligatoire');
    card.back = String(back).trim();
  }
  if (color !== undefined) card.color = normalizeColor(color, card.color);
  if (tags !== undefined) card.tags = normalizeTags(tags);

  await card.save();
  res.json(card);
});

exports.remove = asyncHandler(async (req, res) => {
  const card = await Card.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!card) throw new HttpError(404, 'Carte introuvable');
  res.json({ message: 'Carte supprimée' });
});

exports.review = asyncHandler(async (req, res) => {
  const { rating, endOfDay } = req.body;
  if (!RATINGS.includes(rating)) throw new HttpError(400, 'Note invalide (again, hard, medium, easy)');

  const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
  if (!card) throw new HttpError(404, 'Carte introuvable');

  const now = new Date();
  const next = schedule(card, rating, now, endOfDay);

  card.dueAt = next.dueAt;
  card.intervalDays = next.intervalDays;
  if (!card.reviews) card.firstReviewedAt = now;
  card.reviews = (card.reviews || 0) + 1;
  if (rating === 'again') card.lapses += 1;
  card.lastRating = rating;
  card.lastReviewedAt = now;

  await card.save();
  res.json(card);
});

// Import en masse (CSV analysé côté navigateur, envoyé en JSON)
exports.importCards = asyncHandler(async (req, res) => {
  const folder = await ownedFolder(req.user._id, req.params.folderId);
  const { cards, skipDuplicates = true } = req.body;

  if (!Array.isArray(cards) || cards.length === 0) throw new HttpError(400, 'Aucune carte à importer');
  if (cards.length > 1000) throw new HttpError(400, 'Maximum 1000 cartes par envoi');

  const known = new Set();
  if (skipDuplicates) {
    const existing = await Card.find({ folder: folder._id, user: req.user._id }).select('front').lean();
    existing.forEach((c) => known.add(c.front.trim().toLowerCase()));
  }

  const docs = [];
  let skipped = 0;
  for (const raw of cards) {
    const front = String(raw?.front || '').trim().slice(0, 1000);
    const back = String(raw?.back || '').trim().slice(0, 2000);
    if (!front || !back) {
      skipped += 1;
      continue;
    }
    const key = front.toLowerCase();
    if (skipDuplicates && known.has(key)) {
      skipped += 1;
      continue;
    }
    known.add(key);
    docs.push({
      user: req.user._id,
      folder: folder._id,
      front,
      back,
      color: normalizeColor(raw.color, folder.color),
      tags: normalizeTags(raw.tags),
      dueAt: new Date(),
    });
  }

  if (docs.length) {
    await Card.insertMany(docs);
    await Folder.updateOne({ _id: folder._id }, { $set: { updatedAt: new Date() } });
  }
  res.status(201).json({ created: docs.length, skipped });
});
