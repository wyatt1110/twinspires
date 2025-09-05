# 🏇 TwinSpires VPS Setup Instructions

## ⚡ **QUICK SETUP (5 Minutes)**

### **Step 1: Download Files**
1. Download this entire `vps-package` folder from Supabase
2. Extract/unzip to your VPS desktop (e.g., `C:\twinspires-scraper\`)

### **Step 2: Install Node.js (if not already installed)**
```bash
# Check if Node.js is installed
node --version

# If not installed, download from: https://nodejs.org
# Install Node.js 18+ (LTS recommended)
```

### **Step 3: Install Dependencies**
```bash
# Navigate to the extracted folder
cd C:\twinspires-scraper

# Install required packages
npm install
```

### **Step 4: Configure Environment**
1. Copy `env-example.txt` to `.env`
2. Edit `.env` file:
   ```
   SUPABASE_URL=https://gwvnmzflxttdlhrkejmy.supabase.co
   SUPABASE_SERVICE_KEY=[your_actual_service_key]
   ```

### **Step 5: Test Setup**
```bash
# Test scraper manually
npm run manual

# Should show: "✅ Successfully loaded TwinSpires page"
# If you see "Access Denied" - that's the Akamai issue we're solving!
```

### **Step 6: Start Scheduler**
```bash
# Start the scheduler (runs permanently)
npm start

# You should see:
# ✅ TwinSpires VPS Scheduler is running!
# 📋 Schedule: Every 2 minutes during 16:00-02:00 UK time
```

---

## 🕐 **SCHEDULING DETAILS**

- **Active Hours**: 16:00-02:00 UK time (11 hours daily)
- **Frequency**: Every 2 minutes during active hours
- **Total Daily Runs**: ~330 executions
- **Outside Hours**: Script checks time and exits immediately

---

## 🖥️ **RUNNING PERMANENTLY**

### **Option A: Keep Terminal Open**
```bash
npm start
# Leave terminal window open
# To stop: Ctrl+C
```

### **Option B: Background Process (Recommended)**
```bash
# Install PM2 (process manager)
npm install -g pm2

# Start with PM2 (runs in background)
pm2 start scheduler.js --name "twinspires-scraper"

# Check status
pm2 status

# View logs
pm2 logs twinspires-scraper

# Stop
pm2 stop twinspires-scraper
```

### **Option C: Windows Service (Advanced)**
- Use `node-windows` to create a Windows service
- Starts automatically with computer

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

1. **"Cannot find module"**
   ```bash
   npm install
   ```

2. **"Access Denied" from TwinSpires**
   ```
   ✅ This means VPS is working correctly!
   ❌ If still getting blocked, try different VPS provider
   ```

3. **"SUPABASE_SERVICE_KEY missing"**
   ```
   Check .env file has correct service key
   ```

4. **Process stops running**
   ```bash
   # Check if still running
   pm2 status
   
   # Restart if needed  
   pm2 restart twinspires-scraper
   ```

---

## 📊 **MONITORING**

### **Check if Running:**
```bash
pm2 status
```

### **View Live Logs:**
```bash
pm2 logs twinspires-scraper --lines 50
```

### **Check Database Updates:**
Go to Supabase and check `usa_auto_race_odds` table for recent updates.

---

## 🚀 **SUCCESS INDICATORS**

You'll know it's working when you see:
- ✅ `Successfully loaded TwinSpires page`
- ✅ `Found X runners in database`
- ✅ `Race Summary: X matches, X updates`
- ✅ New odds appearing in Supabase every 2 minutes

---

## ⚠️ **IMPORTANT NOTES**

1. **Don't close terminal** if using `npm start` directly
2. **Use PM2** for background operation
3. **VPS must stay on** during racing hours (16:00-02:00 UK)
4. **Same database** as Railway - both systems work together
5. **No conflicts** - VPS handles TwinSpires, Railway handles other data

---

## 📞 **Need Help?**

If you see any errors, copy the exact error message and we can debug together!
