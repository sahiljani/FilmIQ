#!/bin/bash

# Setup Post-Receive Hook for Automatic Deployment
# Run this script on your server: bash setup-post-receive-hook.sh

set -e

SITE_PATH="/home/janisahil-movie/htdocs/movie.janisahil.com"
GIT_HOOKS_DIR="$SITE_PATH/.git/hooks"

echo "==================================="
echo "Setting up Post-Receive Hook"
echo "==================================="
echo "Site Path: $SITE_PATH"
echo ""

# Create hooks directory if it doesn't exist
if [ ! -d "$GIT_HOOKS_DIR" ]; then
    echo "Creating .git/hooks directory..."
    mkdir -p "$GIT_HOOKS_DIR"
else
    echo ".git/hooks directory already exists"
fi

# Create post-receive hook
echo "Creating post-receive hook..."
cat > "$GIT_HOOKS_DIR/post-receive" << 'HOOK_SCRIPT'
#!/bin/bash

# Source NVM to get Node.js in PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

SITE_PATH="/home/janisahil-movie/htdocs/movie.janisahil.com"
LOG_FILE="$SITE_PATH/deployment.log"

echo "================================" >> "$LOG_FILE"
echo "Deployment started at $(date)" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

cd "$SITE_PATH" || exit 1

# Pull latest changes
echo "Pulling latest changes from main branch..." >> "$LOG_FILE"
git checkout main >> "$LOG_FILE" 2>&1
git pull origin main >> "$LOG_FILE" 2>&1

# Install dependencies
echo "Installing dependencies..." >> "$LOG_FILE"
npm install >> "$LOG_FILE" 2>&1

# Build frontend
echo "Building frontend..." >> "$LOG_FILE"
npm run build >> "$LOG_FILE" 2>&1

# Restart application with PM2
echo "Restarting application with PM2..." >> "$LOG_FILE"
pm2 restart ecosystem.config.js --env production >> "$LOG_FILE" 2>&1

# Save PM2 configuration
echo "Saving PM2 configuration..." >> "$LOG_FILE"
pm2 save >> "$LOG_FILE" 2>&1

echo "Deployment completed at $(date)" >> "$LOG_FILE"
echo "================================" >> "$LOG_FILE"

HOOK_SCRIPT

# Make post-receive hook executable
chmod +x "$GIT_HOOKS_DIR/post-receive"
echo "✓ Post-receive hook created and made executable"
echo ""

echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Post-receive hook has been successfully configured."
echo "Now whenever you push to the repository, automatic deployment will trigger."
echo ""
echo "Deployment logs will be saved to: $SITE_PATH/deployment.log"
echo ""
echo "To view deployment logs:"
echo "  tail -f $SITE_PATH/deployment.log"
echo ""
