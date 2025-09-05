# 🚀 Digital Ocean VPS Deployment Guide

## 📋 **Prerequisites**

- Digital Ocean VPS (Ubuntu 20.04+ recommended)
- Root or sudo access
- Domain name (optional, for SSL)

## 🛠️ **Step 1: VPS Setup**

### **Connect to your VPS**
```bash
ssh root@your-vps-ip
```

### **Update system**
```bash
apt update && apt upgrade -y
```

### **Install Node.js 18**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs
```

### **Install Docker (Optional but recommended)**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER
```

## 📦 **Step 2: Deploy the Scraper**

### **Clone the repository**
```bash
git clone https://github.com/wyatt1110/twinspires.git
cd twinspires
```

### **Install dependencies**
```bash
npm install
```

### **Configure environment**
```bash
cp .env.example .env
nano .env
```

Add your Supabase credentials:
```env
SUPABASE_URL=https://gwvnmzflxttdlhrkejmy.supabase.co
SUPABASE_SERVICE_KEY=your_actual_service_key_here
NODE_ENV=production
```

## 🚀 **Step 3: Start the Service**

### **Option A: PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start the scraper
pm2 start scheduler.js --name "twinspires-scraper"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### **Option B: Docker**
```bash
# Build and start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
```

## 🔧 **Step 4: Configure Firewall (Optional)**

```bash
# Allow SSH
ufw allow ssh

# Allow HTTP/HTTPS (if you plan to add a web interface)
ufw allow 80
ufw allow 443

# Enable firewall
ufw enable
```

## 📊 **Step 5: Monitoring Setup**

### **Install monitoring tools**
```bash
# Install htop for system monitoring
apt install htop

# Install logrotate for log management
apt install logrotate
```

### **Create log rotation config**
```bash
nano /etc/logrotate.d/twinspires
```

Add:
```
/root/twinspires/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 root root
}
```

## 🔍 **Step 6: Verify Deployment**

### **Check if running**
```bash
# PM2
pm2 status

# Docker
docker-compose ps

# System resources
htop
```

### **Check logs**
```bash
# PM2
pm2 logs twinspires-scraper

# Docker
docker-compose logs -f
```

### **Test database connection**
```bash
npm run test
```

## 🛡️ **Step 7: Security Hardening**

### **Create non-root user**
```bash
adduser twinspires
usermod -aG sudo twinspires
usermod -aG docker twinspires
```

### **Setup SSH key authentication**
```bash
# On your local machine
ssh-copy-id twinspires@your-vps-ip
```

### **Disable root login**
```bash
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart ssh
```

## 📈 **Step 8: Performance Optimization**

### **Increase file limits**
```bash
nano /etc/security/limits.conf
# Add:
# * soft nofile 65536
# * hard nofile 65536
```

### **Optimize Node.js**
```bash
# Add to .env
NODE_OPTIONS="--max-old-space-size=512"
```

## 🔄 **Step 9: Backup Strategy**

### **Create backup script**
```bash
nano /root/backup-twinspires.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /root/backups/twinspires_$DATE.tar.gz /root/twinspires
find /root/backups -name "twinspires_*.tar.gz" -mtime +7 -delete
```

### **Setup cron job**
```bash
crontab -e
# Add: 0 2 * * * /root/backup-twinspires.sh
```

## 🚨 **Troubleshooting**

### **Common issues:**

1. **Out of memory**
   ```bash
   # Check memory usage
   free -h
   # Add swap if needed
   fallocate -l 1G /swapfile
   chmod 600 /swapfile
   mkswap /swapfile
   swapon /swapfile
   ```

2. **Process not starting**
   ```bash
   # Check logs
   pm2 logs twinspires-scraper
   # Restart
   pm2 restart twinspires-scraper
   ```

3. **Database connection issues**
   ```bash
   # Test connection
   npm run test
   # Check environment variables
   cat .env
   ```

## 📞 **Support**

If you encounter issues:
1. Check the logs first
2. Verify all environment variables
3. Ensure VPS has stable internet
4. Check system resources (CPU, memory, disk)

---

**Your TwinSpires scraper is now running on Digital Ocean! 🎉**
