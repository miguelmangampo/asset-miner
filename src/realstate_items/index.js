

import {
  supabase,
} from '../helpers.js'
import {
  isEqual,
} from '../helpers.js';

const TABLE_NAME = 'realstate_items';


const getBySourceId = async (sourceId) => {
  const { data: dbData } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('source_id', sourceId)
    .eq('inactive', false);
  return dbData;
}

const insert = async (data) => {
  try {
    const { error } = await supabase.from(TABLE_NAME).insert(data);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error occurs upon insert ", e);
    return e;
  }
};

const update = async (data) => {
  try {
    const {
      location,
      address,
      lot_area,
      floor_area,
      price,
      description,
      type,
      property_type,
      link,
      thumbnail_url,
      inactive,
    } = data;
    const { error, } = await supabase
      .from(TABLE_NAME)
      .update({
        location,
        address,
        lot_area,
        floor_area,
        price,
        description,
        type,
        property_type,
        link,
        thumbnail_url,
        inactive
      })
      .eq("link", link);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error occurs upon update ", e);
    return e;
  }
};

const markInActive = async(dbList, apiList) => {
  const apiMap = new Map(apiList.map(item => [item.link, item]));
  let count = 1;
  for (const dt of dbList) {
    const apiItem = apiMap.get(dt?.link);
    const log = `${dt?.property_type} -- ${dt?.type} -- ${dt?.address}`;
    if (!apiItem) {
      dt.inactive = true;
      await update(dt);
      console.log(`${count}. Inactive: `, log)
    }
    count++;
  }
};

const mergeData = async(sourceId, dataList) => {
  const dbList = await getBySourceId(sourceId);
  let count = 1;
  const dbMap = new Map(dbList.map(item => [item.link, item]));

  for (const dataObj of dataList) {
    const dt = { ...dataObj, source_id: sourceId };
    const dbItem = dbMap.get(dt?.link); 
    const log = `${dt?.property_type} -- ${dt?.type} -- ${dt?.address}`;
    const counterLabel = `${count}/${dataList?.length}. Source: ${sourceId}.`;
    if (!dbItem) {
      await insert(dt);
      console.log(`${counterLabel} Inserted: `, log)
    } else if (!isEqual(dbItem, dt)) {
      await update(dt);
      console.log(`${counterLabel} Updated: `, log)
    } else {
      console.log(`${counterLabel} Existing: `, log)
    }
    count++;
  }

  await markInActive(dbList, dataList);
};

export {
  getBySourceId,
  insert,
  update,
  markInActive,
  mergeData,
}