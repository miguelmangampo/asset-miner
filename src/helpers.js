import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import _ from 'lodash'
import { fetch as undiciFetch } from 'undici';
import 'dotenv/config';

// Setup Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const initBrowserPage = async(headless = true) => {
  const browser = await puppeteer.launch({
    // headless: false,
    // defaultViewport : { width: 1028, height: 1604 },
    // args: [
    //     '--disable-web-security',
    //     '--disable-features=IsolateOrigins,site-per-process',
    //     '--disable-blink-features=AutomationControlled',
    //     '--incognito',
    // ], // This settings is to enforce disabled headless browser

    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ], // args if we're going to deploy in render or heroku 
  });

  const PAGE_TIMEOUT = 120000;
  const [page] = await browser.pages();
  page.setDefaultNavigationTimeout(PAGE_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);
  await page.setUserAgent('Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.35');
  return { page, browser };
};

const isEqual = (
  obj1,
  obj2,
  fieldsToCompare = ['location', 'address', 'lot_area', 'floor_area', 'price', 'description', 'type', 'property_type', 'link', 'thumbnail_url']
) => {
  const obj1Subset = _.pick(obj1, fieldsToCompare);
  const obj2Subset = _.pick(obj2, fieldsToCompare);
  return _.isEqual(obj1Subset, obj2Subset);
}

const fetchUnidici = async (url, referer) => {
  try {
    console.log("Trying undici fetch...");
    const res = await undiciFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": referer,
      },
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Undici failed:", err);
    return null
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Encodes a raw string into a URL-friendly format 
 * suitable for use as a query parameter value.
 *
 * @param {string} rawString The string to be encoded.
 * @returns {string} The encoded string.
 */ 
const encodeStringUrl = (rawString) => {
  return encodeURIComponent(rawString);
}

export {
  initBrowserPage,
  supabase,
  isEqual,
  fetchUnidici,
  delay,
  encodeStringUrl,
};