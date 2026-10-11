const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flashmind';
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connecté : ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('Connexion MongoDB impossible :', err.message);
    console.error('Démarrez MongoDB ou corrigez MONGO_URI dans backend/.env');
    process.exit(1);
  }
};
