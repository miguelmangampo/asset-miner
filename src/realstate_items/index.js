

import {
  supabase,
} from '../helpers.js'

const TABLE_NAME = 'realstate_items';


const getBySourceId = async (sourceId) => {
  const { data: dbData } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('source_id', sourceId);
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
      })
      .eq("link", link);
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error occurs upon update ", e);
    return e;
  }
};

export {
  getBySourceId,
  insert,
  update,
}