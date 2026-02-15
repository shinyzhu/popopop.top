#!/usr/bin/env bash
set -euo pipefail

# ─── Configuration ───
APP_NAME="popopop"
APP_DIR="/opt/popopop.top"
REPO_URL="https://github.com/shinyzhu/popopop.top.git"
SERVICE_FILE="popopop.service"
NGINX_CONF="nginx/popopop.top.conf"
DOMAIN="popopop.top"

echo "══════════════════════════════════════════"
echo "  Deploying $APP_NAME to Ubuntu server"
echo "══════════════════════════════════════════"

# ─── 1. Install system dependencies ───
echo "[1/7] Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq curl nginx certbot python3-certbot-nginx

# Install Node.js 20 LTS if not present
if ! command -v node &>/dev/null; then
  echo "       Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
echo "       Node $(node -v) / npm $(npm -v)"

# ─── 2. Clone or update the repository ───
echo "[2/7] Setting up application directory..."
if [ -d "$APP_DIR/.git" ]; then
  echo "       Pulling latest changes..."
  cd "$APP_DIR"
  sudo -u www-data git pull --ff-only
else
  echo "       Cloning repository..."
  sudo git clone "$REPO_URL" "$APP_DIR"
  sudo chown -R www-data:www-data "$APP_DIR"
fi

# ─── 3. Install Node.js dependencies ───
echo "[3/7] Installing npm dependencies..."
cd "$APP_DIR"
sudo -u www-data npm ci --omit=dev

# ─── 4. Ensure fonts directory exists ───
echo "[4/7] Ensuring fonts directory..."
sudo -u www-data mkdir -p "$APP_DIR/public/fonts"

# ─── 5. Install systemd service ───
echo "[5/7] Configuring systemd service..."
sudo cp "$APP_DIR/$SERVICE_FILE" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable "$APP_NAME"
sudo systemctl restart "$APP_NAME"
echo "       Service status: $(systemctl is-active $APP_NAME)"

# ─── 6. Configure nginx ───
echo "[6/7] Configuring nginx..."
sudo cp "$APP_DIR/$NGINX_CONF" /etc/nginx/sites-available/"$DOMAIN"
sudo ln -sf /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ─── 7. SSL certificate (optional – requires DNS pointed at this server) ───
echo "[7/7] Setting up SSL with Let's Encrypt..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "       Requesting certificate for $DOMAIN..."
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --redirect -m "admin@$DOMAIN" || {
    echo "       ⚠ Certbot failed – make sure DNS is pointed at this server."
    echo "       You can run later:  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  }
else
  echo "       Certificate already exists. Renewing if needed..."
  sudo certbot renew --dry-run
fi

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo "  App running at https://$DOMAIN"
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status $APP_NAME"
echo "    sudo journalctl -u $APP_NAME -f"
echo "    sudo systemctl restart $APP_NAME"
echo "══════════════════════════════════════════"
