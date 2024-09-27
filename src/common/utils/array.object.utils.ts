export const arrayToMapObject = (array: any, key: string | number) => {
  const initialValue = {};
  return array.reduce(
    (obj: any, item: any) => ({
      ...obj,
      [item[key]]: item,
    }),
    initialValue,
  );
};
// Function to get the index of the enum value
export const getEnumIndex = (enumObj: any, value: string) => {
  return Object.values(enumObj).indexOf(value);
};

/**
 * Function to convert an array of objects to an object of arrays
 * @param array - Array of objects
 * @param key - Key to group by inside the object
 * @returns Object of arrays grouped by the key
 */
export const arrayToMapArray = (array: any[], key: string | number) => {
  const initialValue: Record<string | number, any[]> = {};
  return array.reduce((obj: Record<string | number, any[]>, item: any) => {
    const groupKey = item[key];
    if (!obj[groupKey]) {
      obj[groupKey] = [];
    }
    obj[groupKey].push(item);
    return obj;
  }, initialValue);
};
