# Deployment Guide - CineWise AI

## Prerequisites
- Node.js (v14 or higher)
- MySQL Database
- PM2 installed globally (`npm install pm2@latest -g`)

## Environment Variables

### GitHub Secrets/Variables Setup
Add the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

```
PORT=3000
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
BREVO_API_KEY=your_brevo_api_key
GEMINI_API_KEY=your_gemini_api_key
TMDB_ACCESS_TOKEN=your_tmdb_access_token
TMDB_API_KEY=your_tmdb_api_key
```

## Manual Deployment with PM2

### 1. Clone Repository
```bash
git clone https://github.com/sahiljani/FilmIQ.git
cd FilmIQ
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Setup Environment Variables
Create a `.env` file in the project root with all required environment variables (see `.env.example`).

### 5. Start Application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Check application status
pm2 status
```

### 6. Setup Auto-Start on Reboot

1. Get your PATH:
```bash
echo $PATH
```

2. Edit crontab:
```bash
crontab -e
```

3. Add these lines (replace $PATH with your actual PATH):
```
PATH=/home/user/.nvm/versions/node/v14.19.3/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
@reboot pm2 resurrect &> /dev/null
```

## PM2 Useful Commands

```bash
# View application logs
pm2 logs cinewise-ai

# Restart application
pm2 restart cinewise-ai

# Stop application
pm2 stop cinewise-ai

# Delete application from PM2
pm2 delete cinewise-ai

# Monitor application
pm2 monit

# View detailed info
pm2 info cinewise-ai
```

## CloudPanel Deployment

If using CloudPanel:

1. Upload your code to `htdocs/www.yourdomain.com/`
2. Install dependencies: `npm install`
3. Build frontend: `npm run build`
4. Create `.env` file with your environment variables
5. Start with PM2: `pm2 start ecosystem.config.js --env production`
6. Save PM2 config: `pm2 save`
7. Setup cron job for auto-restart as described above

## Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs cinewise-ai

# Check if port is already in use
lsof -i :3000
```

### Database connection issues
- Verify database credentials in `.env`
- Ensure database server is accessible
- Check firewall rules

### Environment variables not loading
- Ensure `.env` file is in the project root
- Verify PM2 is using the production environment: `pm2 start ecosystem.config.js --env production`
- Check that `dotenv` package is installed

## GitHub Actions CI/CD (Optional)

For automated deployments, you can set up GitHub Actions to deploy on push to main branch. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/your/app
            git pull origin main
            npm install
            npm run build
            pm2 restart cinewise-ai
```

Add these secrets to GitHub:
- `SERVER_HOST`: Your server IP/hostname
- `SERVER_USER`: SSH username
- `SSH_PRIVATE_KEY`: Your SSH private key

## Production Checklist

- [ ] All environment variables are set
- [ ] Database is configured and accessible
- [ ] Frontend is built (`npm run build`)
- [ ] PM2 is installed globally
- [ ] Application is running (`pm2 status`)
- [ ] PM2 configuration is saved (`pm2 save`)
- [ ] Cron job is configured for auto-restart
- [ ] Logs are being monitored (`pm2 logs`)
- [ ] SSL/HTTPS is configured (if applicable)
- [ ] Domain is pointing to server
- [ ] Firewall allows traffic on application port

## Support

For issues or questions, please open an issue on GitHub.
