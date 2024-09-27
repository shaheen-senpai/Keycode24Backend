// import {
//   PaginationInput,
//   PaginationOutput,
//   VariableType,
// } from '../../customer-interface/schema/graphql.schema';

/**
 * To generate pagination metadata.
 * @param paginationInput - limit and offset input
 * @param total - total number of records
 * @returns PaginationOutput object with values calculated
 */
// export function getPaginationMetaData(
//   paginationInput: PaginationInput,
//   total: number,
// ): PaginationOutput {
//   return {
//     total,
//     hasNext: total > paginationInput.offset + paginationInput.limit,
//   };
// }

export async function isValidPdf(buffer: Buffer): Promise<boolean> {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.lastIndexOf('%PDF-') === 0 &&
    buffer.lastIndexOf('%%EOF') > -1
  );
}

export function dateFormatter(
  date: string,
  timeZone: string,
  format: string,
): string {
  return new Date(date)
    .toLocaleString(format, {
      timeZone: timeZone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .replace(/ /g, '/');
}

export const getCORSOrigin = () => {
  return '*';
};

/**
 * To Adjust the Date based on the specified timezone
 * @param date
 * @param offset
 * @param timezoneOffset
 * @returns
 */
export const getAdjustedUserTimezoneDate = async (
  date: Date | undefined,
  offset: number,
  timezoneOffset: number,
): Promise<Date | null> => {
  if (!date) {
    return null;
  }
  const adjustedDate = new Date();
  adjustedDate.setTime(
    date.getTime() + (offset + timezoneOffset) * 60 * 60 * 1000,
  );
  return adjustedDate;
};
