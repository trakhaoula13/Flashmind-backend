const Card = require('../models/Card');

const DEFAULT_NEW_PER_DAY = 15;

// Combien de nouvelles cartes l'utilisateur peut encore découvrir aujourd'hui
async function newCardsRemaining(user, dayStart) {
  const limit = Number.isInteger(user.newCardsPerDay) ? user.newCardsPerDay : DEFAULT_NEW_PER_DAY;
  const introduced = await Card.countDocuments({ user: user._id, firstReviewedAt: { $gte: dayStart } });
  return { limit, introduced, remaining: Math.max(0, limit - introduced) };
}

module.exports = { newCardsRemaining, DEFAULT_NEW_PER_DAY };
