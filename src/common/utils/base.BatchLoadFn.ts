import { FindOptionsWhere, In, ObjectLiteral, Repository } from 'typeorm';

/**
 * BatchLoad Function for fields that are _ManyToOne_ or _OneToOne_ relations in the parent entity.
 * @template K type of key
 * @template V type of value
 * @param keys array of keys
 * @param valueRepo Repository where values are stored
 * @param fieldName Field/Column name of key
 * @param relations Relations that need to be joined.
 * @returns an array of values which matches the input array of keys both in order and length.
 */
export async function getValuesForBatchLoadFn_ForOneType<
  K,
  V extends ObjectLiteral,
>(
  keys: K[],
  valueRepo: Repository<V>,
  fieldName: string,
  relations: string[] | undefined = undefined,
): Promise<V[]> {
  const values = await valueRepo.find({
    where: { [fieldName]: In(keys) } as FindOptionsWhere<V>,
    relations: relations,
  });
  const valueMap = new Map<K, V>();
  values.forEach((value) => {
    valueMap.set((value as any)[fieldName], value);
  });
  const result = keys.map((key) => {
    return valueMap.get(key) || {};
  });
  return result as V[];
}

/**
 * BatchLoad Function for fields that are _ManyToMany_ or _OneToMany_ relations in the parent entity.
 * @template K type of key
 * @template V type of value
 * @param keys array of keys
 * @param valueRepo Repository where values are stored
 * @param fieldName Field/Column name of key
 * @param relations Relations that need to be joined.
 * @returns an array of values which matches the input array of keys both in order and length.
 */
export async function getValuesForBatchLoadFn_ForManyType<
  K,
  V extends ObjectLiteral,
>(
  keys: K[],
  valueRepo: Repository<V>,
  fieldName: string,
  relations: string[] | undefined = undefined,
): Promise<V[][]> {
  const values = await valueRepo.find({
    where: { [fieldName]: In(keys) } as FindOptionsWhere<V>,
    relations: relations,
  });
  const valueMap = new Map<K, V[]>();
  values.forEach((value) => {
    if (!valueMap.has((value as any)[fieldName])) {
      valueMap.set((value as any)[fieldName], [value]);
      return;
    }
    const valArr = valueMap.get((value as any)[fieldName]);
    valArr?.push(value);
    valueMap.set((value as any)[fieldName], valArr as V[]);
  });
  const result = keys.map((key) => {
    return valueMap.get(key) || [];
  });
  return result as V[][];
}

/**
 * Function to get the required batch load function.
 * Generic logic of batch load function is:
 * 1. Get the values from the database from the keys provided
 * 2. Create a map of key -> value(s)*.
 * This is to overcome possible order/count mismatch in the DB result with respect to the keys
 * 3. Iterate over the keys and give the value(s)* using the map.
 *
 * *If the dataloder needs to resolve each key to an array of values, then the map will be key -> value[]
 * @template K type of key
 * @template V Entity of value
 * @param valueRepo Repository where values are stored.
 * @param fieldName Field/Column name of key
 * @param relations Relations to be joined if any.
 * @param isToOneType Whether the resovled field is a OneToOne or ManyToOne relation in its parent
 * @returns Batch Load function for dataloader
 */
export function getBatchLoadFn<K, V extends ObjectLiteral>(
  valueRepo: Repository<V>,
  fieldName: string,
  relations: string[] | undefined = undefined,
  isToOneType = true,
): any {
  if (isToOneType) {
    return async (keys: readonly K[]) => {
      return getValuesForBatchLoadFn_ForOneType<K, V>(
        keys as K[],
        valueRepo,
        fieldName,
        relations,
      );
    };
  } else {
    return async (keys: readonly K[]) => {
      return getValuesForBatchLoadFn_ForManyType<K, V>(
        keys as K[],
        valueRepo,
        fieldName,
        relations,
      );
    };
  }
}
