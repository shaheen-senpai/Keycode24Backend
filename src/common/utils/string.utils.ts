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

export function splitName(name?: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!name) {
    return {
      firstName: null,
      lastName: null,
    };
  }
  const parts = name.trim().split(/\s+/);

  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : null,
  };
}
