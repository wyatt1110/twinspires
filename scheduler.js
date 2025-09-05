#!/usr/bin/env node

const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');

console.log('🏇 TwinSpires VPS Scheduler Starting...');
console.log('📅 Schedule: Every 2 minutes during 16:00-02:00 UK time');
console.log('🌍 Current time:', new Date().toISOString());

// Get UK time
function getUKTime() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour12: false
  });
}

// Get UK hour for scheduling
function getUKHour() {
  const now = new Date();
  const ukTimeString = now.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const hour = parseInt(ukTimeString.split(':')[0]);
  return hour;
}

// Check if we're in USA racing hours (16:00-02:00 UK time)
function isUSARacingHours() {
  const ukHour = getUKHour();
  const inUSARacingHours = ukHour >= 16 || ukHour <= 2;
  return inUSARacingHours;
}

// Run TwinSpires scraper
function runTwinSpiresScraper() {
  const currentlyUSARacingHours = isUSARacingHours();
  const ukTime = getUKTime();
  
  console.log('\n' + '🏇'.repeat(50));
  console.log(`🏇 TwinSpires Scraper execution check at ${ukTime}`);
  console.log(`🕐 UK Racing Hours Active: ${currentlyUSARacingHours}`);
  console.log(`🖥️  VPS Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Working directory: ${process.cwd()}`);
  console.log('🏇'.repeat(50));
  
  if (currentlyUSARacingHours) {
    console.log('🏇 ▶️  STARTING TwinSpires Scraper...');
    console.log(`🕐 Execution time: ${ukTime}`);
    
    const scriptPath = path.join(__dirname, 'twinspires-scraper.js');
    console.log(`📂 Script path: ${scriptPath}`);
    
    const scraperProcess = spawn('node', [scriptPath], {
      stdio: ['inherit', 'inherit', 'inherit'],
      env: { ...process.env }
    });
    
    console.log(`🚀 TwinSpires process spawned with PID: ${scraperProcess.pid}`);
    
    scraperProcess.on('error', (error) => {
      console.error('❌ TwinSpires Scraper error:', error);
    });
    
    scraperProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ TwinSpires Scraper completed successfully (exit code ${code})`);
      } else {
        console.error(`❌ TwinSpires Scraper failed with exit code ${code}`);
      }
    });

    // Timeout protection
    const timeout = setTimeout(() => {
      console.error('⏰ TwinSpires taking too long, killing process...');
      scraperProcess.kill('SIGTERM');
    }, 300000); // 5 minutes timeout

    scraperProcess.on('exit', () => {
      clearTimeout(timeout);
    });

  } else {
    console.log(`⏰ Outside USA racing hours (16:00-02:00 UK) - skipping TwinSpires`);
    console.log(`🕐 Current UK time: ${ukTime}`);
  }
}

// Schedule: Every 2 minutes
console.log('📅 Setting up cron job: Every 2 minutes');
const cronJob = cron.schedule('*/2 * * * *', () => {
  runTwinSpiresScraper();
}, {
  scheduled: false
});

// Start the cron job
console.log('🚀 Starting cron scheduler...');
cronJob.start();

console.log('✅ TwinSpires VPS Scheduler is running!');
console.log('📋 Schedule Details:');
console.log('   - Frequency: Every 2 minutes');  
console.log('   - Active Hours: 16:00-02:00 UK time');
console.log('   - Outside Hours: Script runs but exits immediately');
console.log('   - Timezone: Europe/London (UK)');
console.log('');
console.log('🛑 To stop: Ctrl+C');
console.log('');

// Run initial execution
console.log('🎯 Running initial execution...');
runTwinSpiresScraper();

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, stopping scheduler...');
  cronJob.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, stopping scheduler...');
  cronJob.destroy();
  process.exit(0);
});
