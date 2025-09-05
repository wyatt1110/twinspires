#!/usr/bin/env node
/**
 * TwinSpires Race Scraper
 * 
 * Scrapes today's races from TwinSpires.com and matches them with races in the drf_races table
 * Based on track_name, race_number, and today's date (MM/DD/YYYY format)
 */

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');
require('dotenv').config();

class TwinSpiresScraper {
  constructor() {
    console.log('🏇 TwinSpires Scraper starting initialization...');
    
    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing required environment variables:');
      console.error(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'SET' : 'MISSING'}`);
      console.error(`   SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING'}`);
      throw new Error('Missing required environment variables');
    }
    
    // Initialize Supabase client with service role key for full access
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    this.browser = null;
    this.page = null;
    
    console.log('✅ TwinSpires Scraper initialized successfully');
    console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log(`🔑 Service Key: ${process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING'}`);
    console.log(`🏗️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🖥️  VPS Mode: Using local Puppeteer (no proxy needed)`);
  }

  /**
   * Get today's date in MM/DD/YYYY format to match the database
   */
  getTodaysDate() {
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Smart browser initialization - tries Browserless first, falls back to local Chrome
   */
  async initBrowser() {
    console.log('🚀 Starting VPS browser initialization...');
    
    try {
      console.log('🖥️  Launching local Puppeteer for VPS...');
      
      // VPS browser configuration with Chromium
      const launchOptions = {
        executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        defaultViewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        timeout: 30000
      };

      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch(launchOptions);
      
      console.log('✅ VPS Puppeteer browser launched successfully');
      await this.setupPage();
      
    } catch (error) {
      console.error('💥 VPS browser initialization failed:', error);
      console.error('💥 Error details:', error.message);
      
      if (error.message.includes('Could not find Chromium')) {
        console.error('🔍 Chrome/Chromium not found. Please install Chrome or Chromium on VPS.');
      }
      
      throw error;
    }
  }

  /**
   * Setup page with enhanced anti-detection configurations
   */
  async setupPage() {
    this.page = await this.browser.newPage();
    console.log('✅ New page created');
    
    // Set up proxy authentication if credentials are provided
    if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
      await this.page.authenticate({
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD
      });
      console.log('🔐 Proxy authentication set up');
    }
    
    // Enhanced user agent to avoid detection
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    // Set minimal viewport to save memory
    await this.page.setViewport({ 
      width: 1024, 
      height: 768,
      deviceScaleFactor: 1
    });
    
    // Set additional headers to appear more legitimate
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Override webdriver property and other detection mechanisms
    await this.page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete navigator.webdriver;
      
      // Override the plugins property to use a custom getter
      Object.defineProperty(navigator, 'plugins', {
        get() {
          return [
            {
              0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin"
            }
          ];
        },
      });
      
      // Override the languages property to use a custom getter
      Object.defineProperty(navigator, 'languages', {
        get() {
          return ['en-US', 'en'];
        },
      });
      
      // Override the webgl vendor and renderer
      const getParameter = WebGLRenderingContext.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel(R) Iris(TM) Graphics 6100';
        }
        return getParameter(parameter);
      };
      
      // Mock chrome property
      window.chrome = {
        runtime: {}
      };
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: 'denied' }) :
          originalQuery(parameters)
      );
    });
    
    // Set timeouts
    this.page.setDefaultTimeout(45000);
    this.page.setDefaultNavigationTimeout(45000);
    
    console.log('✅ Page configured with anti-detection measures');
    
    // Small delay to ensure all anti-detection measures are active
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Navigate to TwinSpires today's races page
   */
  async navigateToTodaysRaces() {
    const url = 'https://www.twinspires.com/bet/todays-races/time';
    console.log(`📍 Navigating to: ${url}`);
    
    try {
      // Navigate with extended timeout
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded', // Less strict wait
        timeout: 45000
      });
      
      console.log('✅ Successfully loaded TwinSpires page');
      console.log(`📄 Page title: ${await this.page.title()}`);
      console.log(`🔗 Current URL: ${await this.page.url()}`);
      
      // Take screenshot for debugging
      try {
        await this.page.screenshot({ 
          path: '/tmp/twinspires-debug.png',
          fullPage: false
        });
        console.log('📸 Debug screenshot saved to /tmp/twinspires-debug.png');
      } catch (screenshotError) {
        console.log('⚠️  Could not take screenshot:', screenshotError.message);
      }
      
      // Check page content for debugging
      const bodyHTML = await this.page.evaluate(() => document.body.innerHTML);
      console.log(`📝 Page content length: ${bodyHTML.length} characters`);
      
      if (bodyHTML.includes('blocked') || bodyHTML.includes('captcha') || bodyHTML.includes('Access Denied')) {
        console.error('🚫 Page appears to be blocked or has captcha');
        console.error('📝 Sample content:', bodyHTML.substring(0, 500));
        
        // Try to get more info about the blocking
        const pageTitle = await this.page.title();
        if (pageTitle.includes('Access Denied')) {
          console.error('🚫 IP Address is blocked by Akamai CDN');
          console.error('💡 Solutions:');
          console.error('   1. Use a residential proxy service');
          console.error('   2. Try a different VPS provider');
          console.error('   3. Use a VPN service');
          console.error('   4. Contact VPS provider for IP change');
        }
        
        throw new Error('TwinSpires page blocked or requires captcha');
      }
      
      // Try multiple selectors for race elements
      const possibleSelectors = [
        '.track.track-list--row',
        '.track-list--row', 
        '.track',
        '[data-testid*="race"]',
        '[class*="track"]',
        '[class*="race"]',
        '.race-card',
        '.race-list'
      ];
      
      let foundSelector = null;
      for (const selector of possibleSelectors) {
        try {
          console.log(`🔍 Trying selector: ${selector}`);
          await this.page.waitForSelector(selector, { timeout: 5000 });
          foundSelector = selector;
          console.log(`✅ Found race elements with selector: ${selector}`);
          break;
        } catch (selectorError) {
          console.log(`❌ Selector ${selector} not found:`, selectorError.message);
          continue;
        }
      }
      
      if (!foundSelector) {
        // Log all available classes for debugging
        const availableClasses = await this.page.evaluate(() => {
          const allElements = document.querySelectorAll('*');
          const classes = new Set();
          allElements.forEach(el => {
            if (el.className && typeof el.className === 'string') {
              el.className.split(' ').forEach(cls => {
                if (cls.includes('track') || cls.includes('race')) {
                  classes.add(cls);
                }
              });
            }
          });
          return Array.from(classes).slice(0, 20); // First 20 relevant classes
        });
        
        console.error('❌ No race selectors found. Available track/race classes:', availableClasses);
        
        // Try to find any clickable elements
        const clickableElements = await this.page.evaluate(() => {
          const elements = document.querySelectorAll('button, a, [onclick]');
          return Array.from(elements).slice(0, 10).map(el => ({
            tagName: el.tagName,
            className: el.className,
            textContent: el.textContent?.substring(0, 50)
          }));
        });
        
        console.error('🔍 Available clickable elements:', clickableElements);
        throw new Error(`No race elements found on page. Available classes: ${availableClasses.join(', ')}`);
      }
      
    } catch (error) {
      console.error('❌ Error navigating to TwinSpires:', error.message);
      
      // Enhanced error logging
      try {
        const currentUrl = await this.page.url();
        const pageTitle = await this.page.title();
        console.error(`🔗 Final URL: ${currentUrl}`);
        console.error(`📄 Final title: ${pageTitle}`);
      } catch (debugError) {
        console.error('❌ Could not get page debug info:', debugError.message);
      }
      
      throw error;
    }
  }

  /**
   * Extract race data from the TwinSpires page
   */
  async extractRaceData() {
    console.log('📊 Extracting race data from page...');
    
    // Take a screenshot for debugging
    await this.page.screenshot({ path: 'twinspires-debug.png', fullPage: false });
    console.log('📸 Screenshot saved as twinspires-debug.png');
    
    const races = await this.page.evaluate(() => {
      const raceElements = document.querySelectorAll('.track.track-list--row');
      const extractedRaces = [];
      
      raceElements.forEach((element, index) => {
        try {
          // Debug: Get HTML structure of first few elements
          if (index < 3) {
            console.log(`DEBUG Element ${index} HTML:`, element.innerHTML.substring(0, 500));
          }
          
          // Extract track name using multiple strategies
          let trackName = null;
          
          // Strategy 1: Look for specific track-name element with ID pattern
          const trackNameWithId = element.querySelector('.track-name[id*="track-name"]');
          if (trackNameWithId) {
            trackName = trackNameWithId.textContent.trim();
          }
          
          // Strategy 2: Look for track-name class specifically within track-race-info
          if (!trackName) {
            const trackNameInRaceInfo = element.querySelector('.track-race-info .track-name');
            if (trackNameInRaceInfo) {
              trackName = trackNameInRaceInfo.textContent.trim();
            }
          }
          
          // Strategy 3: Fall back to any track-name element
          if (!trackName) {
            const anyTrackName = element.querySelector('.track-name');
            if (anyTrackName) {
              trackName = anyTrackName.textContent.trim();
            }
          }
          
          // Clean up track name if it contains race details
          if (trackName) {
            // Remove "Expert" prefix
            trackName = trackName.replace(/^ExpertE/, '').trim();
            
            // Try to extract just the track name part (stop at Race X or other race details)
            const cleanNameMatch = trackName.match(/^([^R]+?)(?:Race\s+\d+|$)/);
            if (cleanNameMatch) {
              trackName = cleanNameMatch[1].trim();
            }
            
            // Remove trailing race details that might remain
            trackName = trackName.replace(/\$\d+[kK]?\s+.*$/, '').trim();
            trackName = trackName.replace(/Purse:.*$/, '').trim();
            trackName = trackName.replace(/\d+yo.*$/, '').trim();
          }
          
          // Extract race number
          const raceNumberElement = element.querySelector('.race-number span');
          let raceNumberText = raceNumberElement ? raceNumberElement.textContent.trim() : null;
          let raceNumber = null;
          
          if (raceNumberText) {
            // Extract number from "Race 3" format
            const match = raceNumberText.match(/Race\s+(\d+)/);
            if (match) {
              raceNumber = parseInt(match[1]);
            }
          }
          
          // Get the element ID for potential future use (contains race link info)
          const elementId = element.id || null;
          
          // Debug output for first few elements
          if (index < 5) {
            console.log(`DEBUG Race ${index}: trackName="${trackName}", raceNumber=${raceNumber}, elementId="${elementId}"`);
          }
          
          // Only add if we have both track name and race number
          if (trackName && trackName.length > 0 && raceNumber) {
            extractedRaces.push({
              trackName: trackName,
              raceNumber: raceNumber,
              elementId: elementId,
              index: index
            });
          }
        } catch (error) {
          console.log(`Error processing race element ${index}:`, error);
        }
      });
      
      return extractedRaces;
    });
    
    console.log(`✅ Extracted ${races.length} races from TwinSpires`);
    
    // Log extracted races for verification
    races.forEach((race, index) => {
      console.log(`   ${index + 1}. ${race.trackName} - Race ${race.raceNumber}`);
    });
    
    return races;
  }

  /**
   * Match TwinSpires races with database races
   */
  async matchRacesWithDatabase(scrapedRaces) {
    console.log('\n🔍 Matching races with database...');
    const todaysDate = this.getTodaysDate();
    console.log(`📅 Looking for races on: ${todaysDate}`);
    
    const matches = [];
    const unmatched = [];
    
    for (const race of scrapedRaces) {
      try {
        console.log(`\n🔎 Searching for: ${race.trackName} - Race ${race.raceNumber}`);
        
        // Query the database for exact match
        const { data: dbRaces, error } = await this.supabase
          .from('drf_races')
          .select('race_id, track_name, race_number, race_date, purse')
          .eq('track_name', race.trackName)
          .eq('race_number', race.raceNumber)
          .eq('race_date', todaysDate)
          .limit(1);
        
        if (error) {
          console.error(`❌ Database query error:`, error.message);
          continue;
        }
        
        if (dbRaces && dbRaces.length > 0) {
          const match = {
            ...race,
            dbRace: dbRaces[0],
            raceId: dbRaces[0].race_id,
            matched: true
          };
          matches.push(match);
          console.log(`✅ MATCH FOUND: ${race.trackName} - Race ${race.raceNumber}`);
          console.log(`   📝 Database: race_id=${dbRaces[0].race_id}, purse=${dbRaces[0].purse || 'N/A'}`);
        } else {
          // Try fuzzy matching for track names
          console.log(`🔍 Trying fuzzy match for track name...`);
          
          const { data: fuzzyRaces, error: fuzzyError } = await this.supabase
            .from('drf_races')
            .select('race_id, track_name, race_number, race_date, purse')
            .ilike('track_name', `%${race.trackName.split(' ')[0]}%`)
            .eq('race_number', race.raceNumber)
            .eq('race_date', todaysDate);
          
          if (fuzzyError) {
            console.error(`❌ Fuzzy query error:`, fuzzyError.message);
            continue;
          }
          
          if (fuzzyRaces && fuzzyRaces.length > 0) {
            const match = {
              ...race,
              dbRace: fuzzyRaces[0],
              raceId: fuzzyRaces[0].race_id,
              matched: true,
              fuzzyMatch: true
            };
            matches.push(match);
            console.log(`✅ FUZZY MATCH: ${race.trackName} -> ${fuzzyRaces[0].track_name} - Race ${race.raceNumber}`);
            console.log(`   📝 Database: race_id=${fuzzyRaces[0].race_id}, purse=${fuzzyRaces[0].purse || 'N/A'}`);
          } else {
            unmatched.push(race);
            console.log(`❌ NO MATCH: ${race.trackName} - Race ${race.raceNumber}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error matching race ${race.trackName} - Race ${race.raceNumber}:`, error.message);
        unmatched.push(race);
      }
    }
    
    return { matches, unmatched };
  }

  /**
   * Convert fractional odds to decimal odds
   * @param {string} fractionalOdds - Odds in format like "1/9", "15", "6", "SCR"
   * @returns {number|null} - Decimal odds or null if invalid
   */
  convertToDecimal(fractionalOdds) {
    if (!fractionalOdds || fractionalOdds === 'SCR' || fractionalOdds === 'NR') {
      return null;
    }
    
    // Handle fractional odds like "1/9"
    if (fractionalOdds.includes('/')) {
      const [numerator, denominator] = fractionalOdds.split('/').map(n => parseFloat(n.trim()));
      if (numerator && denominator) {
        return ((numerator / denominator) + 1).toFixed(2);
      }
    }
    
    // Handle whole number odds like "15"
    const wholeOdds = parseFloat(fractionalOdds);
    if (!isNaN(wholeOdds)) {
      return (wholeOdds + 1).toFixed(2);
    }
    
    return null;
  }

  /**
   * Extract race URL from element ID or navigate by clicking
   * @param {Object} raceMatch - The race match object
   * @returns {boolean} - True if navigation successful
   */
  async navigateToRace(raceMatch) {
    if (!raceMatch.elementId) return false;
    
    try {
      // Create a fresh page to avoid detached frame issues
      console.log('🔄 Creating fresh page for race navigation...');
      const racePage = await this.browser.newPage();
      
      // Set user agent
      await racePage.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Navigate to main races page
      await racePage.goto('https://www.twinspires.com/bet/todays-races/time', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      await racePage.waitForSelector('.track.track-list--row', { timeout: 10000 });
      
      // Try to find and click the specific race element
      const elementSelector = `#${raceMatch.elementId}`;
      
      await racePage.waitForSelector(elementSelector, { timeout: 10000 });
      console.log(`🖱️  Clicking race element: ${raceMatch.elementId}`);
      
      // Click the race element to navigate to the race page
      await racePage.click(elementSelector);
      
      // Wait for navigation to complete
      await racePage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
      
      const newUrl = await racePage.url();
      console.log(`✅ Navigated to: ${newUrl}`);
      
      // Replace the old page with the new one
      await this.page.close();
      this.page = racePage;
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error navigating to race: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract MTP (Minutes to Post) from race detail page
   * @returns {number|null} - Minutes to post or null if not found
   */
  async extractMTP() {
    try {
      // Wait for MTP element to load
      await this.page.waitForSelector('.mtp-badge', { timeout: 5000 });
      
      const mtp = await this.page.evaluate(() => {
        const mtpElement = document.querySelector('.mtp-badge .mtp-value');
        if (mtpElement) {
          const mtpText = mtpElement.textContent.trim();
          const mtpNumber = parseInt(mtpText);
          if (!isNaN(mtpNumber)) {
            return mtpNumber;
          }
        }
        return null;
      });
      
      console.log(`📊 Extracted MTP: ${mtp} minutes`);
      return mtp;
      
    } catch (error) {
      console.log(`⚠️ Could not extract MTP: ${error.message}`);
      return null;
    }
  }

  /**
   * Navigate to pools tab and extract pools data
   * @returns {Object} - Pools data with totals and individual horse data
   */
  async extractPoolsData() {
    try {
      console.log('🏊 Navigating to Pools tab...');
      
      // Click on Pools tab
      await this.page.click('#pools');
      await this.page.waitForSelector('.pools-basic', { timeout: 5000 });
      
      // Wait a moment for data to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const poolsData = await this.page.evaluate(() => {
        const data = {
          totals: {},
          horses: []
        };
        
        // Extract totals from header
        const totalsHeader = document.querySelector('.pools-header-totals');
        if (totalsHeader) {
          const winTotal = totalsHeader.querySelector('.pools-row__win')?.textContent?.trim();
          const placeTotal = totalsHeader.querySelector('.pools-row__place')?.textContent?.trim();
          const showTotal = totalsHeader.querySelector('.pools-row__show')?.textContent?.trim();
          
          data.totals = {
            win: winTotal,
            place: placeTotal,
            show: showTotal
          };
        }
        
        // Extract individual horse data
        const horseRows = document.querySelectorAll('.pools-basic .pools-row');
        horseRows.forEach(row => {
          try {
            // Extract post position
            const postElement = row.querySelector('.saddle-cloth');
            if (!postElement) return;
            
            const postPosition = parseInt(postElement.textContent.trim());
            if (isNaN(postPosition)) return;
            
            // Extract odds
            const oddsElement = row.querySelector('.pools-odds');
            const odds = oddsElement ? oddsElement.textContent.trim() : null;
            
            // Extract win pool amount
            const winElement = row.querySelector('.pools-row__win .amount');
            const winAmount = winElement ? winElement.textContent.trim() : null;
            
            // Extract place pool amount  
            const placeElement = row.querySelector('.pools-row__place .amount');
            const placeAmount = placeElement ? placeElement.textContent.trim() : null;
            
            // Extract show pool amount
            const showElement = row.querySelector('.pools-row__show .amount');
            const showAmount = showElement ? showElement.textContent.trim() : null;
            
            data.horses.push({
              postPosition: postPosition,
              odds: odds,
              winAmount: winAmount,
              placeAmount: placeAmount,
              showAmount: showAmount
            });
            
          } catch (error) {
            console.log('Error processing horse row:', error);
          }
        });
        
        return data;
      });
      
      console.log(`✅ Extracted pools data for ${poolsData.horses.length} horses`);
      return poolsData;
      
    } catch (error) {
      console.error(`❌ Error extracting pools data: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean amount string by removing $ and commas
   * @param {string} amount - Amount string like "$13,686"
   * @returns {number|null} - Cleaned numeric amount
   */
  cleanAmount(amount) {
    if (!amount || amount === 'SCR' || amount === 'NR') {
      return null;
    }
    
    const cleaned = amount.replace(/[$,\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? null : number;
  }

  /**
   * Update race MTP in database
   * @param {string} raceId - The race ID
   * @param {number} mtp - Minutes to post
   */
  async updateRaceMTP(raceId, mtp) {
    if (!raceId || mtp === null) return;
    
    try {
      const { error } = await this.supabase
        .from('drf_races')
        .update({ mtp: mtp })
        .eq('race_id', raceId);
      
      if (error) {
        console.error(`❌ Error updating MTP for ${raceId}: ${error.message}`);
      } else {
        console.log(`✅ Updated MTP for ${raceId}: ${mtp} minutes`);
      }
    } catch (error) {
      console.error(`❌ Database error updating MTP: ${error.message}`);
    }
  }

  /**
   * Update horse pools data in database
   * @param {string} raceId - The race ID
   * @param {Object} horseData - Horse pools data
   */
  async updateHorsePoolsData(raceId, horseData) {
    try {
      // Get the runner from drf_runners table by race_id and post_position
      const { data: runners, error: selectError } = await this.supabase
        .from('drf_runners')
        .select('runner_id, horse_name, post_position')
        .eq('race_id', raceId)
        .eq('post_position', horseData.postPosition);
      
      if (selectError) {
        console.error(`❌ Error finding runner: ${selectError.message}`);
        return;
      }
      
      if (!runners || runners.length === 0) {
        console.log(`⚠️ No runner found for race ${raceId} post position ${horseData.postPosition}`);
        return;
      }
      
      const runner = runners[0];
      console.log(`🐎 Updating data for ${runner.horse_name} (Post #${horseData.postPosition})`);
      
      // Prepare update data
      const updateData = {};
      
      // Convert odds to decimal
      const decimalOdds = this.convertToDecimal(horseData.odds);
      if (decimalOdds) {
        updateData.pool_odds = parseFloat(decimalOdds);
      }
      
      // Clean and set amounts
      const winAmount = this.cleanAmount(horseData.winAmount);
      const placeAmount = this.cleanAmount(horseData.placeAmount);
      const showAmount = this.cleanAmount(horseData.showAmount);
      
      if (winAmount !== null) updateData.win = winAmount;
      if (placeAmount !== null) updateData.place = placeAmount;
      if (showAmount !== null) updateData.show = showAmount;
      
      // Update the runner
      const { error: updateError } = await this.supabase
        .from('drf_runners')
        .update(updateData)
        .eq('runner_id', runner.runner_id);
      
      if (updateError) {
        console.error(`❌ Error updating runner ${runner.runner_id}: ${updateError.message}`);
      } else {
        console.log(`✅ Updated ${runner.horse_name}: odds=${decimalOdds}, win=${winAmount}, place=${placeAmount}, show=${showAmount}`);
      }
      
    } catch (error) {
      console.error(`❌ Database error updating horse data: ${error.message}`);
    }
  }

  /**
   * Scrape individual race data
   * @param {Object} raceMatch - Matched race object with URL info
   */
  async scrapeRaceData(raceMatch) {
    try {
      console.log(`\n🏇 Scraping race: ${raceMatch.trackName} - Race ${raceMatch.raceNumber}`);
      console.log(`📝 Race ID: ${raceMatch.raceId}`);
      console.log(`🆔 Element ID: ${raceMatch.elementId}`);
      
      // Navigate to race page by clicking the element
      const navigationSuccess = await this.navigateToRace(raceMatch);
      if (!navigationSuccess) {
        console.log(`❌ Could not navigate to ${raceMatch.trackName} Race ${raceMatch.raceNumber}`);
        return;
      }
      
      // Extract MTP
      const mtp = await this.extractMTP();
      if (mtp !== null) {
        await this.updateRaceMTP(raceMatch.raceId, mtp);
      }
      
      // Extract pools data
      const poolsData = await this.extractPoolsData();
      if (poolsData) {
        console.log(`📊 Found data for ${poolsData.horses.length} horses`);
        
        // Update each horse's data
        for (const horseData of poolsData.horses) {
          await this.updateHorsePoolsData(raceMatch.raceId, horseData);
        }
      }
      
      console.log(`✅ Completed scraping ${raceMatch.trackName} Race ${raceMatch.raceNumber}`);
      
    } catch (error) {
      console.error(`❌ Error scraping race ${raceMatch.trackName} Race ${raceMatch.raceNumber}: ${error.message}`);
    }
  }

  /**
   * Process all matched races and scrape their data
   * @param {Array} matches - Array of matched race objects
   */
  async processMatchedRaces(matches) {
    if (matches.length === 0) {
      console.log('🚫 No matched races to process');
      return;
    }
    
    console.log(`\n🎯 Processing ${matches.length} matched races...`);
    console.log('='.repeat(60));
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      console.log(`\n📍 Processing race ${i + 1} of ${matches.length}`);
      
      try {
        await this.scrapeRaceData(match);
        
        // Small delay between races to be respectful
        if (i < matches.length - 1) {
          console.log('⏳ Waiting 2 seconds before next race...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Failed to process race ${match.trackName} Race ${match.raceNumber}: ${error.message}`);
        continue; // Continue with next race
      }
    }
    
    console.log('\n🎊 Completed processing all matched races!');
  }

  /**
   * Print summary of matching results
   */
  printSummary(scrapedRaces, matchResults) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TWINSPIRES RACE MATCHING SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${this.getTodaysDate()}`);
    console.log(`🏁 Total races scraped from TwinSpires: ${scrapedRaces.length}`);
    console.log(`✅ Successful matches: ${matchResults.matches.length}`);
    console.log(`❌ Unmatched races: ${matchResults.unmatched.length}`);
    console.log('');
    
    if (matchResults.matches.length > 0) {
      console.log('✅ MATCHED RACES:');
      matchResults.matches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.trackName} - Race ${match.raceNumber}`);
        console.log(`      📝 DB: ${match.dbRace.race_id} | Purse: ${match.dbRace.purse || 'N/A'}`);
        if (match.fuzzyMatch) {
          console.log(`      🔍 Fuzzy match: "${match.trackName}" -> "${match.dbRace.track_name}"`);
        }
      });
      console.log('');
    }
    
    if (matchResults.unmatched.length > 0) {
      console.log('❌ UNMATCHED RACES:');
      matchResults.unmatched.forEach((race, index) => {
        console.log(`   ${index + 1}. ${race.trackName} - Race ${race.raceNumber}`);
      });
      console.log('');
    }
    
    console.log('='.repeat(60));
    
    if (matchResults.matches.length > 0) {
      console.log('🎯 Next Step: These matched races can now be scraped for detailed data');
      console.log('🔗 Each race has an elementId that can be used to find the race link');
    } else {
      console.log('⚠️  No matches found. Check if races exist in database for today');
    }
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    if (this.browser) {
      try {
        if (process.env.BROWSER_WS_ENDPOINT) {
          // If using Browserless, disconnect
          await this.browser.disconnect();
          console.log('🧹 Disconnected from Browserless');
        } else {
          // If using local Sparticuz Chromium, close browser
      await this.browser.close();
          console.log('🧹 Closed Sparticuz Chromium browser');
        }
      } catch (error) {
        console.error('⚠️  Error during browser cleanup:', error.message);
      }
    }
  }

  /**
   * Main scraper execution
   */
  async run() {
    const startTime = new Date();
    console.log('🏇 TwinSpires Scraper starting execution at:', startTime.toISOString());
    console.log(`📅 Target date: ${this.getTodaysDate()}`);
    
    try {
      console.log('📋 Step 1: Initializing browser...');
      await this.initBrowser();
      
      console.log('📋 Step 2: Navigating to TwinSpires...');
      await this.navigateToTodaysRaces();
      
      console.log('📋 Step 3: Extracting race data...');
      const scrapedRaces = await this.extractRaceData();
      
      console.log('📋 Step 4: Matching with database...');
      const matchResults = await this.matchRacesWithDatabase(scrapedRaces);
      
      console.log('📋 Step 5: Printing summary...');
      this.printSummary(scrapedRaces, matchResults);
      
      // Process matched races to extract detailed data
      if (matchResults.matches.length > 0) {
        console.log('\n' + '🎯'.repeat(30));
        console.log('🏇 STARTING DETAILED RACE SCRAPING');
        console.log('🎯'.repeat(30));
        
        console.log('📋 Step 6: Processing matched races...');
        await this.processMatchedRaces(matchResults.matches);
      } else {
        console.log('⚠️  No races to process - skipping detailed scraping');
      }
      
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      console.log(`✅ TwinSpires Scraper completed successfully in ${duration} seconds`);
      
      return matchResults;
      
    } catch (error) {
      console.error('💥 TwinSpires Scraper failed:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Stack trace:', error.stack);
      console.error('💥 Error occurred at step during execution');
      
      // Try to get more details about the error
      if (error.name) console.error('💥 Error name:', error.name);
      if (error.code) console.error('💥 Error code:', error.code);
      
      throw error;
    } finally {
      console.log('🧹 Cleaning up browser resources...');
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 TwinSpires Scraper main() function starting...');
  console.log('🕐 Current time:', new Date().toISOString());
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  
  try {
    console.log('🏗️  Creating TwinSpires Scraper instance...');
    const scraper = new TwinSpiresScraper();
    
    console.log('▶️  Running scraper...');
    await scraper.run();
    
    console.log('🎉 TwinSpires Scraper main() function completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 TwinSpires Scraper main() function failed:', error);
    console.error('💥 Process will exit with code 1');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  console.log('📝 TwinSpires scraper script executed directly');
  
  // Check for test mode
  const isTestMode = process.argv.includes('--test') || process.env.TEST_MODE === 'true';
  if (isTestMode) {
    console.log('🧪 TEST MODE: Running scraper regardless of racing hours');
  }
  
  main();
} else {
  console.log('📝 TwinSpires scraper script loaded as module');
}

module.exports = TwinSpiresScraper;
