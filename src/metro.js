
import { delay } from './helpers.js';
import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 2;

const QUERY_STRINGS = [
    'geographicalArea=NCR',
];

const getDetails = async (urlFilter) => {
    const response = await fetch(`https://www.metrobank.com.ph/.netlify/functions/ropa-request/assets?page=1&order=newest&display=100000&${urlFilter}`);
    const data = await response.json();
    const dataResult = data?.result;

    if (dataResult?.length && Array.isArray(dataResult)) { 
        return dataResult.map(data => ({
            location: data?.city || '',
            address: data?.address || '',
            lot_area: data?.lotArea || 0,
            floor_area: data?.floorArea || 0,
            price: data?.price || 0,
            description: `TCT No.: ${data?.tctNumber || ''} --- Property Acct. No.: ${data?.propAcctNo || ''}`,
            type: data?.propCategory || '',
            property_type: data?.propClass || '',
            link: `${`https://www.metrobank.com.ph/loans/assets-for-sale/properties/details?id=${data?.propAcctNo || ''}`}`,
            thumbnail_url: `https://metrobank-ropa-prod.s3.ap-southeast-1.amazonaws.com/${data?.defaultImage || ''}`,
        }));
    }

    return [];
};

export const startSync = async() => {
    let arrayResult = [];
    let count = 1;
    for (const loc of QUERY_STRINGS) {
        const scrapedData = await getDetails(loc);
        if (scrapedData?.length) {
            arrayResult = [...arrayResult, ...scrapedData];
            console.log(`Link ${count} -- Scraped item/s: ${scrapedData?.length}`);
            count++;
        }
        await delay(1000);
    }
    
    await mergeData(SOURCE_ID, arrayResult);
};
