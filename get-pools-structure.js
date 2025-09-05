const puppeteer = require('puppeteer');

async function getPoolsStructure() {
  console.log('Getting pools structure...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.twinspires.com/bet/program/classic/parx-racing/prx/Thoroughbred/2/pools', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the actual HTML structure
    const structure = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const results = [];
      
      tables.forEach((table, index) => {
        const rows = table.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          results.push({
            tableIndex: index,
            rowCount: rows.length,
            firstRowHTML: rows[0].outerHTML,
            tableClasses: table.className
          });
        }
      });
      
      return results;
    });
    
    console.log('Table structures:');
    structure.forEach((table, index) => {
      console.log(`\nTable ${table.tableIndex}:`);
      console.log(`  Classes: ${table.tableClasses}`);
      console.log(`  Rows: ${table.rowCount}`);
      console.log(`  First row HTML: ${table.firstRowHTML.substring(0, 300)}...`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

getPoolsStructure().catch(console.error);
