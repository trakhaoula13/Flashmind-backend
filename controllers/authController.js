const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { HttpError } = require('../utils/helpers');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, newCardsPerDay: u.newCardsPerDay });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new HttpError(400, 'Nom, email et mot de passe sont obligatoires');
  }
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw new HttpError(409, 'Un compte existe déjà avec cet email');

  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user._id), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(String(password || '')))) {
    throw new HttpError(401, 'Email ou mot de passe incorrect');
  }
  res.json({ token: sign(user._id), user: publicUser(user) });
});

exports.me = (req, res) => res.json({ user: publicUser(req.user) });

// Modifier le nom, l'email et la limite de nouvelles cartes
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, newCardsPerDay } = req.body;
  const user = req.user;

  if (name !== undefined) {
    const clean = String(name).trim();
    if (!clean) throw new HttpError(400, 'Le nom est obligatoire');
    if (clean.length > 60) throw new HttpError(400, 'Le nom est trop long (60 caractères maximum)');
    user.name = clean;
  }

  if (email !== undefined) {
    const clean = String(email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) throw new HttpError(400, 'Email invalide');
    if (clean !== user.email) {
      const taken = await User.findOne({ email: clean, _id: { $ne: user._id } });
      if (taken) throw new HttpError(409, 'Un compte existe déjà avec cet email');
      user.email = clean;
    }
  }

  if (newCardsPerDay !== undefined) {
    const n = Number(newCardsPerDay);
    if (!Number.isInteger(n) || n < 0 || n > 500) {
      throw new HttpError(400, 'La limite doit être un nombre entier entre 0 et 500');
    }
    user.newCardsPerDay = n;
  }

  await user.save();
  res.json({ user: publicUser(user) });
});

// Changer le mot de passe (il faut connaître l'ancien)
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new HttpError(400, 'Ancien et nouveau mot de passe sont obligatoires');
  }
  if (String(newPassword).length < 6) {
    throw new HttpError(400, 'Le nouveau mot de passe doit contenir au moins 6 caractères');
  }

  const user = await User.findById(req.user._id).select('+password');
  // 400 (et non 401) pour ne pas déconnecter l'utilisateur côté navigateur
  if (!(await user.matchPassword(String(currentPassword)))) {
    throw new HttpError(400, 'Mot de passe actuel incorrect');
  }
  if (String(currentPassword) === String(newPassword)) {
    throw new HttpError(400, 'Le nouveau mot de passe doit être différent de l’ancien');
  }

  user.password = String(newPassword);
  await user.save();
  res.json({ message: 'Mot de passe modifié' });
});
