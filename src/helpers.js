import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";
import _ from 'lodash'
import 'dotenv/config';

// Setup Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const initBrowserPage = async(headless = true) => {
  const browser = await puppeteer.launch({
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

export {
  initBrowserPage,
  supabase,
  isEqual,
};