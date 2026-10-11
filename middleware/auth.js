const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/helpers');

exports.protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Connexion requise');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    throw new HttpError(401, 'Session expirée, reconnectez-vous');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new HttpError(401, 'Utilisateur introuvable');
  req.user = user;
  next();
});
