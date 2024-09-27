/**
 * Custom error codes to be send to UI to display proper a response
 */
export const ErrorCodes: { [key: string]: CustomError } = {
  SAMPLE_ERROR: {
    CODE: 'LM1001',
    MESSAGE: 'We can create application level error with error code here',
    HTTPCODE: 400,
  },
};

/**
 * Interface to describe custom errors
 */
export interface CustomError {
  CODE: string;
  MESSAGE: string;
  HTTPCODE: number;
}
