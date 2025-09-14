
import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 4;

const LOCATIONS = [
//   'Davao',
//   'Cavite',
  'NCR',
];

const fetchData = async (page) => {
    const response = await fetch(`https://www.unionbankph.com/api/fa/properties?page=${page}&min_bid_price=0&max_bid_price=0&type_of_property=&type_of_residential=&location=${LOCATIONS.join(',')}&city=&lot_area=0&floor_area=0&sort_by_price=`);
    const data = await response.json();
    return data;
};

const mapData = (properties) => {
    return (properties || []).map(p => ({
        location: p?.city || '',
        address: p?.thumbnail_alt || '',
        lot_area: p?.lot_area || 0,
        floor_area: p?.floor_area || 0,
        price: p?.min_bid_price || 0,
        description: '',
        type: p?.type_of_property || '',
        property_type: p?.type_of_residential || '',
        link: `https://www.unionbankph.com/foreclosed-properties/${p?.id}`,
        thumbnail_url: p?.thumbnail || '',
    }));
};

const generateData = async () => {
    let page = 1;
    let data = await fetchData(page);
    let { page_size, properties } = data || {};
    let result = [...mapData(properties)];
    page++;

    while (page_size && properties?.length && page_size >= page) {
        data = await fetchData(page);
        page_size = data?.page_size;
        properties = data?.properties;
        result = [...result, ...mapData(properties)];
        page++;
    }
    return result;
};

export const startSync = async() => {
    const data = await generateData();
    await mergeData(SOURCE_ID, data);
};
