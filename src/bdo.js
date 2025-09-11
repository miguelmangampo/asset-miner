

import {
  initBrowserPage,
  isEqual,
} from './helpers.js';

import {
  getBySourceId,
  insert,
  update,
} from './realstate_items/index.js'

const SOURCE_ID = 1;
const BDO_URL = 'https://www.bdo.com.ph';
const DETAIL_URL = 'https://www.bdo.com.ph/personal/assets-for-sale/real-estate/details-page';
const LIST_URL = 'https://www.bdo.com.ph/content/bdounibank/en-ph/personal/assets-for-sale/real-estate/results-page.productListing.json?modelName=pmu-real-estate&buttonType=viewDetail&searchFullText=&pageSize=100000&offSet=0&sortBy=jcr%3AlastModified&sortOrder=desc';
// Note. We can get this query string in BDO site by ticking metro manila and all its cities
const LOCATIONS = {
  'Metro Manila': ['Las Piñas City', 'Makati City', 'Malabon City', 'Mandaluyong City', 'Manila City', 'Marikina City', 'Muntinlupa City', 'Parañaque City', 'Pasay City', 'Pasig City', 'Quezon City', 'Taguig City', 'Valenzuela City'],
  'Luzon': ['Cavite']
};

const makeParamLocations = () => {
  let url = '';
  Object.keys(LOCATIONS).forEach(key => {
    url += `&area=${key}`;
    const locs = LOCATIONS[key].reduce((acc, curr) => {
      acc += `&location=${curr}`;
      return acc;
    }, '');
    url += locs;
  });
  return url;
};

const getLocations = () => (
  Object.keys(LOCATIONS).reduce((acc, curr) => {
    acc = [...acc, ...LOCATIONS[curr]];
    return acc;
  }, [])
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


const getDetails = async ({
  path = '',
  thumbnail_url = '',
}) => {
  const { browser, page } = await initBrowserPage();
  let scrapedData;
  try {
    const url = `${DETAIL_URL}${path}`;
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 120000,
    });

    const selector = '.pmu-productfeature-container div.col div.text';
    await page.waitForSelector(selector);

    await delay(1000);

    const propertyType = await page.$eval('.title.titleForJS', element => element.textContent?.split(' in ')?.[0] || '');
    const locations = getLocations();

    scrapedData = await page.$$eval(selector, (element, locations) => {
      const getValue = (i, type) => {
          if (type === 'area') return Number(element?.[i]?.textContent.trim().split(' ')?.[0]);
          if (type === 'price') return Number(element?.[i]?.textContent.trim().split(' ')?.[1].replaceAll(',', ''));
          return element?.[i]?.textContent.trim();
      };
      const address = getValue(0);      
      const location = (locations.find(loc => address.includes(loc)) || '');
      return {
        location,
        address,
        lot_area: getValue(1, 'area'),
        floor_area: getValue(2, 'area'),
        price: getValue(3, 'price'),
        description: getValue(4),
        type: getValue(5),
      };
    }, locations);
    scrapedData.property_type = propertyType;
    scrapedData.link = url;
    scrapedData.thumbnail_url = thumbnail_url;
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    // Close the browser.
    await browser.close();
    return scrapedData;
  }
};

const mergeData = async (dbData) => {
  const dbMap = new Map(dbData.map(item => [item.link, item]));
  const apiResponse = await fetch(`${LIST_URL}${makeParamLocations()}`);
  const { repList = [] } = await apiResponse.json();

  let count = 1;
  for (const dt of repList) {
    const { path, image } = dt;
    const thumbnail_url = `${BDO_URL}${image}`;
    const rsApiData = await getDetails({ path, thumbnail_url });
    const apiData = { ...rsApiData, source_id: SOURCE_ID };

    await delay(500);

    if (rsApiData) {
      const dbItem = dbMap.get(apiData?.link);
      const log = `${apiData?.property_type} -- ${apiData?.type} -- ${apiData?.address}`;
      if (!dbItem) {
        await insert(apiData);
        console.log(`${count}. Inserted: `, log)
      } else if (!isEqual(dbItem, apiData)) {
        await update(apiData);
        console.log(`${count}. Updated: `, log)
      } else {
        console.log(`${count}. Existing: `, log)
      }
    }
    count++;

    await delay(process.env?.BDO_ACTION_TIMEOUT || 1000);
  }
};

export const startSync = async () => {
  console.log('BDO - Data sync. started')
  const dbList = await getBySourceId(SOURCE_ID);
  await mergeData(dbList);
  return true;
};
