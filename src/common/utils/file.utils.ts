import { FindManyOptions, Like, ObjectLiteral, Repository } from 'typeorm';
import { generalError } from '../exception/general.application.exception';

/**
 * To get the effective names(non duplicated wrt some conditions) for the given names.
 * Names can be normal string(entity names) or file names(With extension)
 *
 *  Example: input file name = abc.pdf,
 *  Effective file name will be:-
 *  the first name in [abc.pdf, abc(1).pdf, abc(2).pdf, ...] not found in DB.
 *  Example: input name = 'New Folder',
 *  Effective name will be:- [New Folder || New Folder(1) || New Folder(2)... ]
 *  Note: if abc(1).pdf and abc(3).pdf are in the DB but abc(2).pdf is not, then abc(2).pdf will be the effective name
 * @param inputNames Names whose effective names are to be found.
 * @param repository Repository of the Entity.
 * @param otherConditions Other conditions to be added to the query when finding the records with similar name to the input names.
 * @param isFileName true if input is file names.
 * @returns Array of effective non-duplicate names. This array is index matched with the `inputNames[]`
 */
export async function generateEffectiveNames<Entity extends { name: string }>(
  inputNames: string[],
  repository: Repository<Entity>,
  // TODO: use concrete type to avoid unwanted fields to be passed
  //TODO: add support for relations and other find options
  otherConditions?: ObjectLiteral,
  isFileName: boolean | boolean[] = true,
) {
  try {
    // create name patterns and construct query object with it
    const queryObj: ObjectLiteral | FindManyOptions<Entity> = {
      where: [],
    };
    let isFile: boolean;
    inputNames.forEach((item, index) => {
      // Name can be in the format `<name>.<extension>`.
      isFile = Array.isArray(isFileName) ? isFileName[index] : isFileName;
      const name = isFile ? item.slice(0, item.lastIndexOf('.')) : item;
      const extension = isFile && item.slice(item.lastIndexOf('.') + 1);
      queryObj.where.push(
        {
          ...otherConditions,
          name: Like(item),
        },
        {
          ...otherConditions,
          name: Like(`${name}(%)${extension ? `.${extension}` : ''}`),
        },
      );
    });
    const existingNames = await repository.find(queryObj);
    // create a set of names
    const NameSet = new Set(existingNames.map((item) => item.name));
    const effectiveNames: string[] = [];
    // generate effective names by comparing with the set of names
    inputNames.map((item, index) => {
      isFile = Array.isArray(isFileName) ? isFileName[index] : isFileName;
      const name = isFile ? item.slice(0, item.lastIndexOf('.')) : item;
      const extension = isFile && item.slice(item.lastIndexOf('.') + 1);
      for (let i = 0, pattern: string; true; i++) {
        pattern = i ? `${name}(${i})${extension ? `.${extension}` : ''}` : item;
        if (!NameSet.has(pattern) && !effectiveNames.includes(pattern)) {
          effectiveNames.push(pattern);
          return pattern;
        }
      }
    });
    return effectiveNames;
  } catch (error) {
    generalError('Error while generating effective names!');
  }
}

/* output as follows
 ""                            -->   ""
 "name"                        -->   ""
 "name.txt"                    -->   "txt"
 ".htpasswd"                   -->   ""
 "name.with.many.dots.myext"   -->   "myext"
*/
export const getFileExtension = (fileName: string) => {
  return fileName.slice(
    (Math.max(0, fileName.lastIndexOf('.')) || Infinity) + 1,
  );
};
