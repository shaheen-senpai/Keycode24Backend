export enum USE {
  sig = 'sig',
  enc = 'enc',
}

export enum ALG {
  ES256 = 'ES256',
  ECDH = 'ECDH-ES+A256KW',
}

export enum KTY {
  EC = 'EC',
}
export enum CRV {
  P256 = 'P-256',
}

export const KID_SIGNATURE = 'scribezero-sig-key-1';
export const KID_ENCRYPTION = 'scribezero-enc-key-1';

export enum TOKEN_TYPE {
  JWT = 'JWT',
}
