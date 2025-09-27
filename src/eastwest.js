

import {
  initBrowserPage,
  delay,
} from './helpers.js';

import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 3;
const MAIN_URL = 'https://pre-owned-properties.eastwestbanker.com';
const FILTER = '/?location=NCR%2CCavite'; // NCR & Cavite

const logTemplate = `Source Id ${SOURCE_ID} `

const gotoProps = {
  waitUntil: 'networkidle2',
  timeout: 120000,
};

const getDetails = async () => {
  const { browser, page } = await initBrowserPage();
  const details = [];
  try {
    const url = `${MAIN_URL}${FILTER}`;
    await page.goto(url, gotoProps);
    await page.waitForSelector('.w-dyn-list'); // wait for main list
    await delay(2000);

    const links = await page.evaluate(async () => {
      const propLinks = [];
      const delayFunc = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      while (true) {
        const aTags = document.querySelectorAll('.content_card-info a');
        for (const a of aTags) {
          if (!propLinks.includes(a.href)) {
            propLinks.push(a.href);
          }
        }
        await delayFunc(500);
        const nextPage = document.querySelector('a[aria-label="Next Page"]');
        if (nextPage) {
          nextPage.click();
          if (nextPage?.getAttribute('style')?.includes('display: none')) break;
        }
        else break;
        await delayFunc(500);
      }
      return propLinks;
    });

    console.log(`${logTemplate}Data count: `, links.length)

    let count = 1;
    for (const link of links) {
      await page.goto(link, gotoProps);
      await page.waitForSelector('.content_card-block');
      const detail = await page.$$eval('.content_card-info-text.detailed', async (divs, { link }) => {
        const floor = Number(divs[2].textContent);
        const lot = Number(divs[3].textContent);
        const presyo = Number((document.querySelector('.content_card-price.detailed').textContent || '').replaceAll(',', ''));
        return {
          type: (divs[1].textContent || '').split(' ')[0],
          property_type: divs[1].textContent,
          floor_area: !Number.isNaN(floor) ? floor : 0,
          lot_area: !Number.isNaN(lot) ? lot : 0,
          location: divs[5].textContent,
          address: divs[6].textContent,
          price: !Number.isNaN(presyo) ? presyo : 0,
          thumbnail_url: document.querySelector('.thumbnail-image-block.detailed img')?.src || '',
          description: document.querySelector('.content_card-title.detailed').textContent,
          link,
        };
      }, { link });

      console.log(`${logTemplate}${count}. Data found: `, detail.address)
      details.push(detail);
      count++;
    }
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    // Close the browser.
    await browser.close();
    return details;
  }
};

export const startSync = async () => {
  console.log('Eastwest - Data sync. started')
  const scrapedData = await getDetails();
  await mergeData(SOURCE_ID, scrapedData);
};
