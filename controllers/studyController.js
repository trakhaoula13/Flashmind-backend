const Card = require('../models/Card');
const Folder = require('../models/Folder');
const asyncHandler = require('../utils/asyncHandler');
const { resolveDayStart } = require('../utils/day');
const { newCardsRemaining } = require('../utils/quota');

// Session du jour = cartes déjà étudiées et dues  +  nouvelles cartes (dans la limite quotidienne)
exports.due = asyncHandler(async (req, res) => {
  const now = new Date();
  const dayStart = resolveDayStart(req.query.dayStart, now);
  const base = { user: req.user._id };
  if (req.query.folder) base.folder = req.query.folder;

  const reviews = await Card.find({ ...base, reviews: { $gt: 0 }, dueAt: { $lte: now } })
    .sort({ dueAt: 1 })
    .limit(200)
    .populate('folder', 'name color');

  const { remaining } = await newCardsRemaining(req.user, dayStart);
  const fresh =
    remaining > 0
      ? await Card.find({ ...base, reviews: { $not: { $gt: 0 } } })
          .sort({ createdAt: 1 })
          .limit(remaining)
          .populate('folder', 'name color')
      : [];

  res.json([...reviews, ...fresh]);
});

exports.stats = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const now = new Date();
  const dayStart = resolveDayStart(req.query.dayStart, now);

  const [totalFolders, totalCards, reviewDue, newTotal, reviewedToday, mastered, quota] = await Promise.all([
    Folder.countDocuments({ user }),
    Card.countDocuments({ user }),
    Card.countDocuments({ user, reviews: { $gt: 0 }, dueAt: { $lte: now } }),
    Card.countDocuments({ user, reviews: { $not: { $gt: 0 } } }),
    Card.countDocuments({ user, lastReviewedAt: { $gte: dayStart } }),
    Card.countDocuments({ user, intervalDays: { $gte: 21 } }),
    newCardsRemaining(req.user, dayStart),
  ]);

  const newAvailable = Math.min(newTotal, quota.remaining);
  res.json({
    totalFolders,
    totalCards,
    reviewDue,
    newTotal,
    newAvailable,
    dueNow: reviewDue + newAvailable,
    newLimit: quota.limit,
    newToday: quota.introduced,
    reviewedToday,
    mastered,
  });
});
