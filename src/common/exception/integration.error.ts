import { InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
// import { Logging } from '../../core/authorization/constants/logging.constants';
/**
 * Error codes.
 * Each error code is associated with the case in which it is thrown, given in comments.
 */
export enum ErrorCode {
  //ChargeBee:
  CB_001 = 'CB_001', // on create customer
  CB_002 = 'CB_002', // on get customer
  CB_003 = 'CB_003', // on get subscription by id
  CB_004 = 'CB_004', // on get hosted page
  CB_005 = 'CB_005', // on get hosted page for update
  CB_006 = 'CB_006', // on create subscription
  CB_007 = 'CB_007', // on start free subscription
  CB_008 = 'CB_008', // on end subscription
  CB_009 = 'CB_009', // on get payment sources
  CB_010 = 'CB_010', // on get hosted page for manage payment
  CB_011 = 'CB_011', // on get current subscriptions
  CB_012 = 'CB_012', // on get all subscriptions
  CB_013 = 'CB_013', // on get active subscription

  //OneSpan
  OS_001 = 'OS_001', // on add package
  OS_002 = 'OS_002', // on get package
  OS_003 = 'OS_003', // on delete role (update package)
  OS_004 = 'OS_004', // on post roles (update package)
  OS_005 = 'OS_005', // on delete document
  OS_006 = 'OS_006', // on post document (update package document)
  OS_007 = 'OS_007', // on get E-sign url
  OS_008 = 'OS_008', // on get document
  OS_009 = 'OS_009', // on get consent document
  OS_010 = 'OS_010', // on send package
  OS_011 = 'OS_011', // on get designer url
  OS_012 = 'OS_012', // on get signing status

  //BlockChain
  BC_001 = 'BC_001', // on add user
  BC_002 = 'BC_002', // on update user
  BC_003 = 'BC_003', // on create contract
  BC_004 = 'BC_004', // on approve contract
  BC_005 = 'BC_005', // on upload signed documents
  BC_006 = 'BC_006', // on reject contract
  BC_007 = 'BC_007', // on update contract
  BC_008 = 'BC_008', // on get contract
  BC_009 = 'BC_009', // on get all contracts
  BC_010 = 'BC_010', // on get contract history
  BC_011 = 'BC_011', // on upload contract documents
  BC_012 = 'BC_012', // on update contract documents
  BC_013 = 'BC_013', // on download contract document
  BC_014 = 'BC_014', // on update contract users
  BC_015 = 'BC_015', // on get audit trail
  BC_016 = 'BC_016', // on share contract
  BC_017 = 'BC_017', // on download contract
  BC_018 = 'BC_018', // on delete contract document
  BC_019 = 'BC_019', // on upload documents to folder
  BC_020 = 'BC_020', // on get file hashes
  BC_021 = 'BC_021', // on update signed documents

  //SingPass
  SP_001 = 'SP_001', // on get singpass info
  SP_002 = 'SP_002', // on get singpass signature public key
  SP_003 = 'SP_003', // on generate client assertion token
  SP_004 = 'SP_004', // on invoke token endpoint

  //ML
  ML_001 = 'ML_001', // on submitting a CB request
  ML_002 = 'ML_002', // on getting the result of a request
  ML_003 = 'ML_003', // on generating document summary

  //MERGE
  MR_001 = 'MR_001', // general error thrown by merge

  //TEMPORAL
  TP_001 = 'TP_001', // on temporalClient is undefined
}

export function throwIntegrationError(
  errorCode: ErrorCode,
  error: AxiosError | Error | string,
): never {
  let message = '';
  let errText = '';
  if (axios.isAxiosError(error)) {
    message =
      error.response?.data?.message || error.response || error.message || error;
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;
      const headers = error.response.headers;
      errText = JSON.stringify({
        err: error.toJSON(),
        response: { data, status, headers },
      });
    } else errText = JSON.stringify(error.toJSON());
  }
  // else if (isObject(error) && error.message) {
  //   message = error.message;
  //   errText = JSON.stringify(error);
  // }
  else {
    message = error?.toString();
  }
  // const applicationNamespace = getNamespace(Logging.LogNameSpace);
  const traceId = `applicationNamespace?.get('requestId')`;
  console.error(
    `${traceId} : ${errorCode} - ${message} - START---${errText}---END`,
    undefined,
    'IntegrationError',
  );
  throw new InternalServerErrorException(
    `Internal Server Error: ${errorCode} `,
  );
}
