import { CountRange } from '../../schema/graphql.schema';

export const CountRangeResolver: Record<keyof typeof CountRange, number> = {
  [CountRange.LESS_THAN_20]: 0,
  [CountRange.RANGE_20_TO_50]: 1,
  [CountRange.RANGE_50_TO_100]: 2,
  [CountRange.MORE_THAN_100]: 3,
};
