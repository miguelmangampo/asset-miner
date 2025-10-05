
import { mergeData } from './realstate_items/index.js';

const SOURCE_ID = 8;

const URL = 'https://www.pnb.com.ph/wp-content/themes/pnb/js/db.properties.js'

const getProperties = async () => {
    const response = await fetch(URL);
    const data = await response.json();
    const dataResult = data?.data || [];
    return dataResult;
};

const isValidLocation = (location) => {
    const validLocs = [
        'Caloocan',
        'Las Piñas',
        'Las Pinas',
        'Makati',
        'Malabon',
        'Mandaluyong',
        'Manila',
        'Marikina',
        'Muntinlupa',
        'Navotas',
        'Parañaque',
        'Paranaque',
        'Pasay',
        'Pasig',
        'Quezon City',
        'San Juan',
        'Taguig',
        'Valenzuela',
        'Cavite',
    ];
    return !!validLocs.find(loc => loc.toLowerCase() === location.toLowerCase());
};

const getPropType = (location) => {
    const loc = (location || '').toLowerCase();
    if (loc.includes('townhouse')) return 'Townhouse';
    if (loc.includes('condo')) return 'Condominium';
    if (loc.includes('lot') && (
        loc.includes('blk')
        || loc.includes('block')
    )) return 'House & Lot';
    if (loc.includes('parking')) return 'Parking';

    return 'Others';
};

const getScrapedData = async () => {
    const properties = await getProperties();
    const result = [];
    for (const p of properties) {
        const address = p?.location || '';
        const locationArr = address.split(',');
        const location = (locationArr[locationArr.length - 1] || '').trim();
        const size = Number((p?.size || '').split(' ')?.[0] || '');
        const lot_area = !Number.isNaN(size) ? size : 0;
        const floor_area = 0;
        const priceParse = Number((p?.price || '').replaceAll('Php', '').replaceAll(',', '').trim());
        const price = !Number.isNaN(priceParse) ? priceParse : 0;
        const type = p?.ptitle || '';
        const description = `${p?.id || ''} -- ${p?.ptitle || ''} -- ${p?.size || ''} -- ${p?.price || ''}`;
        const property_type = getPropType(address);
        const link = p?.inquiry || '';

        if (type !== 'Chattels' && isValidLocation(location)) {
            result.push({
                address,
                location,
                lot_area,
                floor_area,
                price,
                type, 
                description,
                property_type,
                link,
                thumbnail_url: null,
            });
        }
    }
    return result;
};

export const startSync = async() => {
    const results = await getScrapedData();
    await mergeData(SOURCE_ID, results);
};
