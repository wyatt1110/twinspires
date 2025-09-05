const puppeteer = require('puppeteer');

async function testPools() {
  console.log('Starting pools test...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to a specific race pools page
    console.log('Navigating to pools page...');
    await page.goto('https://www.twinspires.com/bet/program/classic/parx-racing/prx/Thoroughbred/2/pools', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('Waiting 5 seconds for page to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get page title and URL to confirm we're on the right page
    const title = await page.title();
    const url = await page.url();
    console.log(`Page title: ${title}`);
    console.log(`Current URL: ${url}`);
    
    // Check what selectors exist
    const selectors = await page.evaluate(() => {
      const results = [];
      
      // Check for various pool-related selectors
      const possibleSelectors = [
        'table',
        'tbody tr',
        '.odds',
        '[class*="odds"]',
        '[class*="pool"]',
        '[class*="runner"]'
      ];
      
      possibleSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector: selector,
            count: elements.length
          });
        }
      });
      
      return results;
    });
    
    console.log('Found selectors:');
    selectors.forEach(result => {
      console.log(`${result.selector}: ${result.count} elements`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testPools().catch(console.error);
