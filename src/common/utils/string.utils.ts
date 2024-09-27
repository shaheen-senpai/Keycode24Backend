/**
 * Concats firstName, middleName and lastName.
 * @returns FullName with undefined-names and unwanted spaces removed
 */
export function concatNames(
  firstName: string,
  middleName?: string,
  lastName?: string,
): string {
  return `${firstName} ${middleName || ''} ${lastName || ''}`.trim();
}

/**
 * Get converted string for performing like operation in db query.
 *  //replacing _ with \\_ is to escape _ in postgress query
 * @param q string to be converted
 * @returns converted string that will work with all characters
 */
export function getLikeQueryOperand(q: string): string {
  return `%${q.replace(/_/g, '\\_')}%`;
}
