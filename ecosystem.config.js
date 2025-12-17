
module.exports = {
  apps: [
    {
      name: 'cinewise-ai',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        DB_NAME: process.env.DB_NAME,
        JWT_SECRET: process.env.JWT_SECRET,
        BREVO_API_KEY: process.env.BREVO_API_KEY,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        TMDB_ACCESS_TOKEN: process.env.TMDB_ACCESS_TOKEN,
        TMDB_API_KEY: process.env.TMDB_API_KEY
      }
    }
  ]
};
