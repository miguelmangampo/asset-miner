

import {
  initBrowserPage,
  delay,
} from './helpers.js';

import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 6;
const URLS = [ // Links generated from the website of Landbank dependng on the location, you may use their website to generate the links by location
  // NCR
  'https://www.landbank.com/properties-for-sale?ptype=MSAgICA%3D&preg=TkNSICA%3D&pprov=TU5MICA%3D&sellingprice=0&lotarea=0&floorarea=0&tctnumber=',
  // Cavite
  'https://www.landbank.com/properties-for-sale?ptype=MSAgICA%3D&preg=MDRBICA%3D&pprov=Q0FWICA%3D&sellingprice=0&lotarea=0&floorarea=0&tctnumber=',
];

const logTemplate = `Source Id ${SOURCE_ID} `

const gotoProps = {
  waitUntil: 'networkidle0',
  timeout: 120000,
};

const pageParam = '&page='

const navigate = async (link, page, pageNo) => await page.goto(`${link}${pageParam}${pageNo}`, gotoProps);

const getDetails = async () => {
  const { browser, page } = await initBrowserPage();
  let details = [];
  try {
    for (const url of URLS) {
      let pageNo = 1;
      await navigate(url, page, pageNo);
      await delay(2000);

      while(true) {
        const list = await page.evaluate(async () => {
          const results = [];
          const capitalize = (string) => {
            return string.toLowerCase().split(' ')
              .map(word => {
                if (word.length === 0) {
                  return '';
                }
                return word.charAt(0).toUpperCase() + word.slice(1);
              })
              .join(' ');
          };
          const cards = document.querySelectorAll('div.col-md-4.col-sm-12.item') || [];
          for (const card of cards) {
            const priceText = ((card.querySelector('.title.text-success')?.textContent || '').split(' ')[1] || '').replaceAll(',', '');
            const price = priceText && !Number.isNaN(Number(priceText)) ? Number(priceText) : 0;

            const lotAreaText = (card.querySelector('.d-flex.flex-row.justify-content-between.mb-3')?.querySelectorAll('.text-light')?.[0]?.textContent || '').split(' ')?.[0];
            const lot_area = lotAreaText && !Number.isNaN(Number(lotAreaText)) ? Number(lotAreaText) : 0;

            const floorAreaText = (card.querySelector('.d-flex.flex-row.justify-content-between.mb-3')?.querySelectorAll('.text-light')?.[1]?.textContent || '').split(' ')?.[0];
            const floor_area = floorAreaText && !Number.isNaN(Number(floorAreaText)) ? Number(floorAreaText) : 0;

            const description = card.querySelector('.text-center .card-title')?.textContent || '';
            const type = card.querySelector('.badge.badge-success h6')?.textContent || '';
            const location = description.toLowerCase().replaceAll(' city of ', ' ').replaceAll(type.toLowerCase(), ' ').trim();

            results.push({
              description,
              price,
              address: card.querySelector('.card-text.mb-3.ellipsis')?.textContent || '',
              lot_area,
              floor_area,
              property_type: card.querySelector('.alert.alert-warning')?.querySelector('.align-items-center')?.querySelector('p')?.textContent || '',
              link: card.querySelector('.card-body.text-align-center a.btn.btn-warning.text-white.font-weight-bold')?.href || '',
              thumbnail_url: card.querySelector('img.card-img-top')?.src || '',
              type,
              location: capitalize(location),
            });
          }

          const closeSurveyBtn = document.getElementById('notsurvey');
          if (closeSurveyBtn) closeSurveyBtn.click();
          return results;
        });
        if (list?.length) {
          details = [...details, ...list]
          console.log(`${logTemplate} -- Page: ${pageNo} -- Total count: ${details.length}`)
          pageNo++;
          await navigate(url, page, pageNo);
        } else {
          break;
        }
      }
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
  console.log('Landbank - Data sync. started')
  const scrapedData = await getDetails();
  await mergeData(SOURCE_ID, scrapedData);
};
