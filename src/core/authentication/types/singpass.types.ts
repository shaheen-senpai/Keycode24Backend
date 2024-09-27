export type SingpassInfo = {
  issuer: string;
  authorization_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  scopes_supported: string[];
  subject_types_supported: string[];
  claims_supported: string[];
  grant_types_supported: string[];
  token_endpoint: string;
  token_endpoint_auth_methods_supported: string[];
  token_endpoint_auth_signing_alg_values_supported: string[];
  id_token_signing_alg_values_supported: string[];
  id_token_encryption_alg_values_supported: string[];
  id_token_encryption_enc_values_supported: string[];
  backchannel_authentication_endpoint: string;
  backchannel_token_delivery_modes_supported: string[];
};
