const { spawn } = require('child_process');
const path = require('path');

let runCount = 0;

async function runScraperContinuously() {
  while (true) {
    runCount++;
    console.log(`\n================================================================================`);
    console.log(`🚀 Starting TwinSpires Scraper run #${runCount} at ${new Date().toLocaleString()}`);
    console.log(`================================================================================`);

    const scraperProcess = spawn('node', [path.join(__dirname, 'twinspires-scraper.js')], {
      stdio: 'inherit',
      env: { ...process.env, TEST_MODE: 'true' } // Ensure test mode is active
    });

    await new Promise(resolve => {
      scraperProcess.on('exit', (code) => {
        console.log(`🏁 TwinSpires Scraper run #${runCount} completed with exit code: ${code}`);
        console.log(`⏰ Finished at: ${new Date().toLocaleString()}`);
        if (code !== 0) {
          console.log(`⚠️  Scraper exited with code ${code}, but continuing...`);
        }
        resolve();
      });

      scraperProcess.on('error', (err) => {
        console.error(`❌ Scraper process error: ${err.message}`);
        resolve();
      });
    });

    console.log(`\n⏳ Waiting 30 seconds before next run...`);
    const nextRunTime = new Date(Date.now() + 30000).toLocaleString();
    console.log(`⏰ Next run will start at: ${nextRunTime}`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

console.log('🔄 TwinSpires Continuous Runner Starting...');
console.log('📁 Working directory:', __dirname);
console.log('🕐 Started at:', new Date().toLocaleString());
console.log('⏹️  Press Ctrl+C to stop');

runScraperContinuously().catch(console.error);
