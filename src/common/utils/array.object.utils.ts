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
export const isObject = (obj: any) => {
  if (typeof obj === 'object' && !Array.isArray(obj) && obj !== null) {
    return true;
  } else return false;
};
