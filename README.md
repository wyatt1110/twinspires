# 🏇 TwinSpires VPS Scraper

**Complete VPS deployment package for TwinSpires odds scraping**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](Dockerfile)

## 📋 **Overview**

This scraper automatically collects TwinSpires odds data and updates your Supabase database every 2 minutes during UK racing hours (16:00-02:00). Designed specifically for VPS deployment to avoid IP blocking issues.

## 🚀 **Quick Start**

### **Option 1: Docker Deployment (Recommended)**
```bash
# Clone the repository
git clone https://github.com/wyatt1110/twinspires.git
cd twinspires

# Copy environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### **Option 2: Direct Node.js Deployment**
```bash
# Clone the repository
git clone https://github.com/wyatt1110/twinspires.git
cd twinspires

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the scraper
npm start
```

## 📦 **Package Contents**

- `twinspires-scraper.js` - Main scraper engine
- `scheduler.js` - VPS scheduler (every 2 minutes, 16:00-02:00 UK)
- `run-continuous.js` - Continuous runner for local testing
- `package.json` - Dependencies and scripts
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Docker Compose setup
- `.env.example` - Environment variables template

## ⚙️ **Configuration**

### **Environment Variables**
Create a `.env` file with the following variables:

```env
# Supabase Configuration - REQUIRED
SUPABASE_URL=https://gwvnmzflxttdlhrkejmy.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# VPS Configuration (Optional)
NODE_ENV=production
VPS_LOCATION=your_vps_location

# Scraper Configuration (Optional)
TEST_MODE=false
DEBUG_MODE=false
```

### **Available Scripts**
```bash
npm start          # Start the scheduler (production)
npm run manual     # Run scraper once manually
npm run test       # Test scraper with test mode
```

## 🕐 **Scheduling Details**

- **Active Hours**: 16:00-02:00 UK time (11 hours daily)
- **Frequency**: Every 2 minutes during active hours
- **Total Daily Runs**: ~330 executions
- **Outside Hours**: Script checks time and exits immediately

## 🖥️ **VPS Deployment Options**

### **Option A: PM2 Process Manager (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start scheduler.js --name "twinspires-scraper"

# Check status
pm2 status

# View logs
pm2 logs twinspires-scraper

# Auto-restart on system reboot
pm2 startup
pm2 save
```

### **Option B: Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f twinspires-scraper

# Stop
docker-compose down
```

### **Option C: Systemd Service (Linux)**
```bash
# Create systemd service file
sudo nano /etc/systemd/system/twinspires-scraper.service

# Enable and start service
sudo systemctl enable twinspires-scraper
sudo systemctl start twinspires-scraper

# Check status
sudo systemctl status twinspires-scraper
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Cannot find module"**
   ```bash
   npm install
   ```

2. **"Access Denied" from TwinSpires**
   - ✅ This means VPS is working correctly!
   - ❌ If still getting blocked, try different VPS provider

3. **"SUPABASE_SERVICE_KEY missing"**
   - Check `.env` file has correct service key

4. **Process stops running**
   ```bash
   # Check if still running (PM2)
   pm2 status
   pm2 restart twinspires-scraper
   
   # Check if still running (Docker)
   docker-compose ps
   docker-compose restart
   ```

## 📊 **Monitoring**

### **Check if Running:**
```bash
# PM2
pm2 status

# Docker
docker-compose ps

# Systemd
sudo systemctl status twinspires-scraper
```

### **View Live Logs:**
```bash
# PM2
pm2 logs twinspires-scraper --lines 50

# Docker
docker-compose logs -f twinspires-scraper

# Systemd
sudo journalctl -u twinspires-scraper -f
```

### **Check Database Updates:**
Go to Supabase and check `usa_auto_race_odds` table for recent updates.

## 🚀 **Success Indicators**

You'll know it's working when you see:
- ✅ `Successfully loaded TwinSpires page`
- ✅ `Found X runners in database`
- ✅ `Race Summary: X matches, X updates`
- ✅ New odds appearing in Supabase every 2 minutes

## 🎯 **Why VPS?**

Railway datacenter IPs are blocked by Akamai. VPS residential IPs work perfectly and provide:
- Better IP reputation
- More reliable access
- Dedicated resources
- No memory conflicts with other services

## 📋 **Requirements**

- **Node.js**: 18+ (LTS recommended)
- **Memory**: 512MB+ RAM
- **Storage**: 1GB+ free space
- **Network**: Stable internet connection
- **OS**: Linux, Windows, or macOS

## 🔒 **Security Notes**

- Keep your `.env` file secure and never commit it to version control
- Use environment variables for sensitive data
- Consider using a reverse proxy for additional security
- Regularly update dependencies for security patches

## 📞 **Support**

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all environment variables are correctly set
4. Verify your VPS has stable internet connectivity

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Ready to solve the Akamai blocking issue! 🚀**