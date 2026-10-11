const Folder = require('../models/Folder');
const Card = require('../models/Card');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError, normalizeTags, normalizeColor } = require('../utils/helpers');
const { resolveDayStart } = require('../utils/day');
const { newCardsRemaining } = require('../utils/quota');

// Carte "nouvelle" = jamais étudiée (reviews = 0). Les nouvelles cartes sont limitées par jour.
async function withCounts(folder, req) {
  const now = new Date();
  const dayStart = resolveDayStart(req.query.dayStart);
  const [cardCount, dueCount, newCount, quota] = await Promise.all([
    Card.countDocuments({ folder: folder._id }),
    Card.countDocuments({ folder: folder._id, reviews: { $gt: 0 }, dueAt: { $lte: now } }),
    Card.countDocuments({ folder: folder._id, reviews: { $not: { $gt: 0 } } }),
    newCardsRemaining(req.user, dayStart),
  ]);
  return {
    ...folder.toObject(),
    cardCount,
    dueCount,
    newCount,
    studyCount: dueCount + Math.min(newCount, quota.remaining),
  };
}

exports.list = asyncHandler(async (req, res) => {
  const now = new Date();
  const dayStart = resolveDayStart(req.query.dayStart);

  const folders = await Folder.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
  const [stats, quota] = await Promise.all([
    Card.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$folder',
          total: { $sum: 1 },
          due: { $sum: { $cond: [{ $and: [{ $gt: ['$reviews', 0] }, { $lte: ['$dueAt', now] }] }, 1, 0] } },
          fresh: { $sum: { $cond: [{ $gt: ['$reviews', 0] }, 0, 1] } },
        },
      },
    ]),
    newCardsRemaining(req.user, dayStart),
  ]);
  const map = new Map(stats.map((x) => [String(x._id), x]));

  res.json(
    folders.map((f) => {
      const st = map.get(String(f._id));
      const dueCount = st?.due || 0;
      const newCount = st?.fresh || 0;
      return {
        ...f,
        cardCount: st?.total || 0,
        dueCount,
        newCount,
        studyCount: dueCount + Math.min(newCount, quota.remaining),
      };
    })
  );
});

exports.getOne = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
  if (!folder) throw new HttpError(404, 'Dossier introuvable');
  res.json(await withCounts(folder, req));
});

exports.create = asyncHandler(async (req, res) => {
  const { name, description, color, tags } = req.body;
  if (!name || !String(name).trim()) throw new HttpError(400, 'Le nom du dossier est obligatoire');

  const folder = await Folder.create({
    user: req.user._id,
    name: String(name).trim(),
    description: String(description || '').trim(),
    color: normalizeColor(color, '#10A5A0'),
    tags: normalizeTags(tags),
  });
  res.status(201).json({ ...folder.toObject(), cardCount: 0, dueCount: 0, newCount: 0, studyCount: 0 });
});

exports.update = asyncHandler(async (req, res) => {
  const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
  if (!folder) throw new HttpError(404, 'Dossier introuvable');

  const { name, description, color, tags } = req.body;
  if (name !== undefined) {
    if (!String(name).trim()) throw new HttpError(400, 'Le nom du dossier est obligatoire');
    folder.name = String(name).trim();
  }
  if (description !== undefined) folder.description = String(description).trim();
  if (color !== undefined) folder.color = normalizeColor(color, folder.color);
  if (tags !== undefined) folder.tags = normalizeTags(tags);

  await folder.save();
  res.json(await withCounts(folder, req));
});

exports.remove = asyncHandler(async (req, res) => {
  const folder = await Folder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!folder) throw new HttpError(404, 'Dossier introuvable');
  await Card.deleteMany({ folder: folder._id });
  res.json({ message: 'Dossier supprimé' });
});
