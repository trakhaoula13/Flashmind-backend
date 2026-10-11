const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route introuvable : ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Erreur serveur';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Identifiant invalide';
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  }
  if (err.code === 11000) {
    status = 409;
    message = 'Cette valeur existe déjà';
  }
  if (status >= 500) console.error(err);

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
