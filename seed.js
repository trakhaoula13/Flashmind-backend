// Données de démonstration : node seed.js
// Compte créé : demo@flashmind.app / demo1234
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Folder = require('./models/Folder');
const Card = require('./models/Card');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flashmind');

  const email = 'demo@flashmind.app';
  const old = await User.findOne({ email });
  if (old) {
    await Card.deleteMany({ user: old._id });
    await Folder.deleteMany({ user: old._id });
    await old.deleteOne();
  }

  const user = await User.create({ name: 'Compte Démo', email, password: 'demo1234' });
  const folder = await Folder.create({
    user: user._id,
    name: 'Anglais B2',
    description: 'Vocabulaire pour passer de B1 à C1',
    color: '#10A5A0',
    tags: ['anglais', 'vocabulaire'],
  });

  const words = [
    ['mitigate', 'lessen the effect — Measures to mitigate climate change are urgent.'],
    ['tackle', 'deal with firmly — The government must tackle unemployment.'],
    ['reluctant', 'unwilling — He was reluctant to speak in public.'],
    ['thorough', 'complete, careful — She did a thorough check of the report.'],
    ['crucial', 'extremely important — Sleep is crucial for memory.'],
    ['albeit', 'although — It was a small, albeit important, change.'],
    ['pragmatic', 'practical — We need a pragmatic approach.'],
    ['scrutinise', 'examine closely — Auditors scrutinised every account.'],
  ];
  await Card.insertMany(
    words.map(([front, back]) => ({
      user: user._id,
      folder: folder._id,
      front,
      back,
      color: '#10A5A0',
      tags: ['anglais'],
    }))
  );

  console.log('Données de démonstration créées : demo@flashmind.app / demo1234');
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
