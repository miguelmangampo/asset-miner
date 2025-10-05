
import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 7;

const LOCATION_URL = 'https://www.pagibigfundservices.com/OnlinePublicAuction/ListofProperties/LoadLocations?grpid={grpid}&regionid={regionid}&provinceid={provinceid}&cityid=&brgyid='

const PROPERTIES_URL = 'https://www.pagibigfundservices.com/OnlinePublicAuction/ListofProperties/Load_SearchListProperties_COPA?flag=1&region={regionid}&province={provinceid}&city_muni={city}&prop_type=&range_from=&range_to=&lot_from=&lot_to=&floor_from=&floor_to=&occupancy='

// NOTE: These IDs were derived from analyzing the Pag-IBIG website's structure/flow and are subject to change upon website updates.
const REGION_IDS = [
   // NCR
  '130000000',
   // Calabarzon
  '040000000',
];

const EXCLUDED_DISTRICTS = {
    BATANGAS: true,
    LAGUNA: true,
    QUEZON: true,
    RIZAL: true,
};

const getDistricts = async (regionId) => {
    const url = LOCATION_URL
        .replaceAll('{grpid}', '2') // 2 for districts
        .replaceAll('{provinceid}', '')
        .replaceAll('{regionid}', regionId);
    const response = await fetch(url);
    const data = await response.json();
    const dataResult = data || [];
    return dataResult;
};

const getCities = async (regionId, provinceId) => {
    const url = LOCATION_URL
        .replaceAll('{grpid}', '3') // 3 for cities
        .replaceAll('{provinceid}', provinceId)
        .replaceAll('{regionid}', regionId);
    const response = await fetch(url);
    const data = await response.json();
    const dataResult = data || [];
    return dataResult;
};

const getProperties = async (regionId, provinceId, city) => {
    const url = PROPERTIES_URL
        .replaceAll('{regionid}', regionId)
        .replaceAll('{provinceid}', provinceId)
        .replaceAll('{city}', city);
    const response = await fetch(url);
    const data = await response.json();
    const dataResult = data?.data || [];
    return dataResult;
}

const getThumbnail = async (id) => {
    try {
        const url = 'https://www.pagibigfundservices.com/OnlinePublicAuction/ListofProperties/LoadImageUrl';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_TOKEN' // Add if authentication is needed
            },
            body: JSON.stringify({
                acct_id: id,
                flag: 4,
            }),
        });
        const data = await response.json();
        const imageLink = (data || [])?.[0];
        return `https://aaonline.pagibigfund.gov.ph/OPABucket${imageLink}`
    } catch (e) {
        console.log('Image fetch error: ', e);
        return null
    }
}

const getScrapedData = async () => {
    let result = [];
    for (const regionId of REGION_IDS) {
        let districts = await getDistricts(regionId);
        districts = districts.filter(d => !EXCLUDED_DISTRICTS[d?.result_column1]); // process excluded districts
        for (const district of districts) {
            const provinceId = district?.result_column0 || '';
            const cities = await getCities(regionId, provinceId);
            for (const city of cities) {
                const cityName = city?.result_column1 || '';
                const properties = await getProperties(regionId, provinceId, cityName);
                for (const p of properties) {
                    const lotArea = Number(p?.lot_area);
                    const floorArea = Number(p?.floor_area);
                    const imageRes = await getThumbnail(p?.ropa_id);
                    const address = p?.prop_location || '';
                    const property = {
                        location: p?.city_muni || '',
                        address,
                        lot_area: !Number.isNaN(lotArea) ? lotArea : 0,
                        floor_area: !Number.isNaN(floorArea) ? floorArea : 0,
                        price: !Number.isNaN(p?.min_sellprice) ? p?.min_sellprice : 0,
                        description: `TCT: ${p?.tct_cct_no || ''} -- ROPA ID: ${p?.ropa_id || ''} -- Email: ${p?.email_hbc || ''} -- Contact: ${p?.contact_hbc || ''}`,
                        type: 'Residential',
                        property_type: p?.prop_type || '',
                        link: `https://www.pagibigfundservices.com/OnlinePublicAuction?ropa_id=${p?.ropa_id || ''}`,
                        thumbnail_url: imageRes,
                    };
                    console.log(property)
                    result.push(property);
                }
            }
        }
    }
    return result;
};

export const startSync = async() => {
    const results = await getScrapedData();
    await mergeData(SOURCE_ID, results);
};
