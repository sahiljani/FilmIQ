
require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cinewise-secret-key-998877';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.use(cors());
app.use(express.json());

// Initialize Sequelize with provided production credentials
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: 3306,
    dialect: 'mysql',
    logging: false,
    retry: { max: 5 }
  }
);

// --- INTERNAL MIGRATION TRACKER ---
const Migration = sequelize.define('Migration', {
  name: { type: DataTypes.STRING, unique: true, allowNull: false }
}, { timestamps: true });

// --- MODELS ---
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  resetToken: { type: DataTypes.STRING, allowNull: true },
  resetTokenExpires: { type: DataTypes.DATE, allowNull: true }
});

const MovieCache = sequelize.define('MovieCache', {
  tmdbId: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
});

const Preference = sequelize.define('Preference', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  language: DataTypes.STRING,
  genre: DataTypes.STRING,
  yearStart: DataTypes.INTEGER,
  yearEnd: DataTypes.INTEGER,
  contentType: DataTypes.STRING,
  keywords: DataTypes.TEXT
});

const Interaction = sequelize.define('Interaction', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  movieTitle: { type: DataTypes.STRING, allowNull: false },
  interaction: { type: DataTypes.STRING, allowNull: false },
  timestamp: { type: DataTypes.BIGINT, allowNull: false }
});

const SuggestedMovie = sequelize.define('SuggestedMovie', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  movieTitle: { type: DataTypes.STRING, allowNull: false },
  tmdbId: { type: DataTypes.INTEGER, allowNull: true },
  suggestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const MostLiked = sequelize.define('MostLiked', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  movieTitle: { type: DataTypes.STRING, allowNull: false },
  tmdbId: { type: DataTypes.INTEGER, allowNull: true },
  likeCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  likedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

User.hasMany(Preference, { foreignKey: 'userId' });
User.hasMany(Interaction, { foreignKey: 'userId' });
User.hasMany(SuggestedMovie, { foreignKey: 'userId' });
User.hasMany(MostLiked, { foreignKey: 'userId' });

// --- MIGRATION DEFINITIONS ---
const migrations = [
  {
    name: '001_initial_schema',
    run: async (qi) => {
      // Tables are handled by model definitions in this simplified setup,
      // but we ensure constraints here if sync wasn't used.
      // For this implementation, we'll use sync as the base and migrations for delta.
      await sequelize.sync({ alter: false }); 
      console.log('Migration 001: Schema verified.');
    }
  },
  {
    name: '002_add_indices',
    run: async (qi) => {
      try {
        await qi.addIndex('Interactions', ['userId', 'movieTitle']);
        console.log('Migration 002: Indices added.');
      } catch (e) {
        console.log('Migration 002: Indices might already exist, skipping.');
      }
    }
  },
  {
    name: '003_add_name_to_user',
    run: async (qi) => {
      try {
        await qi.addColumn('Users', 'name', { type: DataTypes.STRING, allowNull: true });
        console.log('Migration 003: Name column added to Users.');
      } catch (e) {
        console.log('Migration 003: Column might already exist, skipping.');
      }
    }
  },
  {
    name: '004_create_movie_cache',
    run: async (qi) => {
      // Handled by sync, but good to have placeholder
      await MovieCache.sync();
      console.log('Migration 004: MovieCache table verified.');
    }
  },
  {
    name: '005_create_suggested_movies',
    run: async (qi) => {
      try {
        await SuggestedMovie.sync();
        await qi.addIndex('SuggestedMovies', ['userId', 'movieTitle']);
        console.log('Migration 005: SuggestedMovie table created with indices.');
      } catch (e) {
        console.log('Migration 005: SuggestedMovie table might already exist, skipping.');
      }
    }
  },
  {
    name: '006_create_most_liked',
    run: async (qi) => {
      try {
        await MostLiked.sync();
        await qi.addIndex('MostLikeds', ['userId', 'movieTitle']);
        console.log('Migration 006: MostLiked table created with indices.');
      } catch (e) {
        console.log('Migration 006: MostLiked table might already exist, skipping.');
      }
    }
  }
];

async function runMigrations() {
  try {
    await sequelize.authenticate();
    // Ensure migration table exists
    await Migration.sync();
    
    for (const m of migrations) {
      const alreadyRun = await Migration.findOne({ where: { name: m.name } });
      if (!alreadyRun) {
        console.log(`🚀 Running migration: ${m.name}`);
        await m.run(sequelize.getQueryInterface());
        await Migration.create({ name: m.name });
        console.log(`✅ Finished: ${m.name}`);
      }
    }
    console.log('✨ All migrations are up to date.');
  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  }
}

// Start DB and run migrations
runMigrations();

// --- HELPERS ---
const sendResetEmail = async (email, token) => {
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "CineWise AI", email: "support@cinewise.ai" },
      to: [{ email }],
      subject: "Reset your CineWise Password",
      htmlContent: `
        <div style="font-family: sans-serif; padding: 40px; background: #0f172a; color: #f1f5f9; border-radius: 12px; max-width: 600px; margin: auto;">
          <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">CineWise AI</h2>
          <p style="font-size: 16px; line-height: 1.6;">You requested a password reset. Click below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">Link expires in 1 hour.</p>
        </div>
      `
    }, {
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
    return true;
  } catch (err) {
    console.error('Brevo Email Error:', err.response?.data || err.message);
    return false;
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Session expired' });
    req.user = user;
    next();
  });
};

// --- ROUTES ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.json({ message: 'If email exists, a link has been sent.' });
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 3600000;
  await user.save();
  await sendResetEmail(email, token);
  res.json({ message: 'Reset email sent.' });
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({ where: { resetToken: token, resetTokenExpires: { [Op.gt]: Date.now() } } });
    if (!user) return res.status(400).json({ error: 'Token invalid/expired' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Reset failed' });
  }
});

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const prefs = await Preference.findOne({ where: { userId: req.user.id }, order: [['updatedAt', 'DESC']] });
    const history = await Interaction.findAll({ where: { userId: req.user.id }, order: [['timestamp', 'ASC']] });
    res.json({ preferences: prefs, history: history, user: { id: req.user.id, email: req.user.email, name: req.user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const [pref, created] = await Preference.findOrCreate({
      where: { userId: req.user.id },
      defaults: { ...req.body, userId: req.user.id }
    });
    if (!created) await pref.update(req.body);
    res.json(pref);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/interactions', authenticateToken, async (req, res) => {
  try {
    const interaction = await Interaction.create({ ...req.body, userId: req.user.id });
    res.json(interaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUGGESTED MOVIES ENDPOINTS ---
app.get('/api/suggested-movies', authenticateToken, async (req, res) => {
  try {
    const suggestedMovies = await SuggestedMovie.findAll({
      where: { userId: req.user.id },
      attributes: ['movieTitle', 'tmdbId']
    });
    const movieTitles = suggestedMovies.map(m => m.movieTitle);
    res.json({ suggestedMovies: movieTitles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suggested-movies', authenticateToken, async (req, res) => {
  try {
    const { movieTitle, tmdbId } = req.body;
    
    // Check if already suggested
    const existing = await SuggestedMovie.findOne({
      where: { userId: req.user.id, movieTitle }
    });
    
    if (existing) {
      return res.json({ message: 'Already suggested', success: false });
    }
    
    // Save as suggested
    const suggested = await SuggestedMovie.create({
      userId: req.user.id,
      movieTitle,
      tmdbId
    });
    
    res.json({ success: true, suggested });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/suggested-movies/batch', authenticateToken, async (req, res) => {
  try {
    const { movies } = req.body; // Array of { movieTitle, tmdbId }
    
    const results = [];
    for (const movie of movies) {
      const existing = await SuggestedMovie.findOne({
        where: { userId: req.user.id, movieTitle: movie.movieTitle }
      });
      
      if (!existing) {
        const suggested = await SuggestedMovie.create({
          userId: req.user.id,
          movieTitle: movie.movieTitle,
          tmdbId: movie.tmdbId
        });
        results.push(suggested);
      }
    }
    
    res.json({ success: true, savedCount: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MOST LIKED MOVIES ENDPOINTS ---
app.get('/api/most-liked', authenticateToken, async (req, res) => {
  try {
    const mostLiked = await MostLiked.findAll({
      where: { userId: req.user.id },
      order: [['likeCount', 'DESC']],
      attributes: ['movieTitle', 'tmdbId', 'likeCount']
    });
    res.json({ mostLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/most-liked', authenticateToken, async (req, res) => {
  try {
    const { movieTitle, tmdbId } = req.body;
    
    const existing = await MostLiked.findOne({
      where: { userId: req.user.id, movieTitle }
    });
    
    if (existing) {
      // Increment like count
      await existing.increment('likeCount');
      return res.json({ success: true, action: 'incremented', mostLiked: existing });
    }
    
    // Create new most liked entry
    const mostLiked = await MostLiked.create({
      userId: req.user.id,
      movieTitle,
      tmdbId,
      likeCount: 1
    });
    
    res.json({ success: true, action: 'created', mostLiked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TMDB CACHE ENDPOINTS ---
app.get('/api/tmdb/cache/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const cache = await MovieCache.findOne({ 
      where: { 
        tmdbId, 
        expiresAt: { [Op.gt]: new Date() } 
      } 
    });
    if (cache) {
      return res.json(cache.data);
    }
    res.status(404).json({ error: 'Cache miss' });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tmdb/cache', async (req, res) => {
  try {
    const { tmdbId, title, data } = req.body;
    // Cache for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const [cache, created] = await MovieCache.findOrCreate({
      where: { tmdbId },
      defaults: { tmdbId, title, data, expiresAt }
    });
    
    if (!created) {
      await cache.update({ data, expiresAt });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Cache failed' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(PORT, () => console.log(`🚀 CineWise Server on Port ${PORT}`));
