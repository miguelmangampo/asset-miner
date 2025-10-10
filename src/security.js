

import {
  initBrowserPage,
  delay,
} from './helpers.js';

import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 5;
const MAIN_URL = 'https://www.securitybank.com/personal/loans/repossessed-assets/properties-for-sale';

const logTemplate = `Source Id ${SOURCE_ID} `
const Residential = 'Residential'
  , Commercial = 'Commercial'
  , Condominium = 'Condominium'
  , Townhouse = 'Townhouse';

const gotoProps = {
  waitUntil: 'networkidle2',
  timeout: 120000,
};

const REGIONS = [
  'National Capital Region',
  'South Luzon',
];

const getDetails = async () => {
  const { browser, page } = await initBrowserPage();
  let details = null;
  try {
    await page.goto(MAIN_URL, gotoProps);
    await page.waitForSelector('.property-table'); // wait for main list
    await delay(2000);

    details = await page.evaluate(async ({ Residential, Commercial, Condominium, Townhouse, REGIONS }) => {
      const sanitize = text => (text || '').replaceAll('\n', '').replaceAll('\t', '');
      const delayFunc = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const list = [];
      for (const region of REGIONS) {
        const locations = Array.from(
          document.querySelector(`optgroup[label="${region}"]`).querySelectorAll('option')
        ).map(node => node.value);

        for (const loc of locations) {
          const rows = document.querySelectorAll(`tr[data-regions="${loc}"]`);

          await delayFunc(1000);

          for (const row of rows) {
            const cells = row.querySelectorAll('td');
            const aTags = row.querySelectorAll('a');
            const presyo = Number(sanitize(cells[4].textContent).replaceAll(',', ''));
            const lotA = Number(sanitize(cells[2].textContent).split(' ')[0]);
            const floorA = Number(sanitize(cells[3].textContent).split(' ')[0]);

            let thumbnail_url, link;
            for (const a of aTags) {
              if (a.textContent === 'Inquire') link = a.href;
              if (a.textContent === 'Image') thumbnail_url = a.href;
            }
            if (!link) link = thumbnail_url;

            let type = 'Others'
            let property_type = 'Others';
            const floor_area = !Number.isNaN(floorA) ? floorA : 0;
            const lot_area = !Number.isNaN(lotA) ? lotA : 0;;
            const location = sanitize(cells[0].textContent);
            const address = sanitize(cells[1].textContent);
            const price = !Number.isNaN(presyo) ? presyo : 0;

            if ((address || '').includes(Residential)) type = Residential;
            else if ((address || '').includes(Commercial)) type = Commercial;

            if ((address || '').includes(Condominium)) property_type = Condominium;
            else if ((address || '').includes(Townhouse)) property_type = Townhouse;

            const sepText = address.split('(');
            const description = sepText.length > 2 ? sepText[2].replaceAll(')', '') : '';
            
            list.push({
              link,
              thumbnail_url,
              type,
              property_type,
              floor_area,
              lot_area,
              location,
              address,
              price,
              description,
            });
          }
        }
      }
      return list;
    }, { Residential, Commercial, Condominium, Townhouse, REGIONS });

    console.log(`${logTemplate}Data count: `, details.length)

  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    // Close the browser.
    await browser.close();
    return details;
  }
};

export const startSync = async () => {
  console.log('Security bank - Data sync. started')
  const scrapedData = await getDetails();
  await mergeData(SOURCE_ID, scrapedData);
};
