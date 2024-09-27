import {
  OnBoardingTokenType,
  UserOrigin,
} from 'src/customer-interface/schema/graphql.schema';

export const ALLOWED_MAIL_DOMAIN = 'contractloom.com';
export const AUTH_TOKEN = 'SCRIBEZERO-TOKEN';
export const REFRESH_TOKEN = 'SCRIBEZERO-REFRESH-TOKEN';
export const COLLAB_AUTH_TOKEN = 'SCRIBEZERO-COLLAB-TOKEN';
export const FAILED_OTPLOGIN_ATTEMPTS = 'FLD_OTP_ATT';
export const MAX_FAILED_OTP_ATTEMPTS = 3;
export const USER_ORG_INVITATION_NOT_FOUND =
  'user-org-invitation-not-found-error';
export enum TokenType {
  AccessToken = 'Access',
  RefreshToken = 'Refresh',
  MfaToken = 'MfaToken',
  OnboardToken = 'OnboardToken',
  VerifyEmailToken = 'VerifyCustomerEmailToken',
  UpdatePasswordToken = 'UpdatePasswordToken',
  OnBoardSubscriptionToken = 'OnBoardSubscriptionToken',
  SingpassEmailConnectToken = 'SingpassEmailConnectToken',
  UserOrganisationInviteToken = 'UserOrganisationInviteToken',
  CollaborateToken = 'CollaborateToken',
  ContractDataCaptureToken = 'ContractDataCaptureToken',
  ResetMfaToken = 'ResetMfaToken',
  ResendVerificationToken = 'ResendVerificationToken',
  ResendUpdatePasswordToken = 'ResendUpdatePasswordToken',
  DownloadContractToken = 'DownloadContractToken',
}

export enum AuthTarget {
  User = 'User',
  Organisation = 'Organisation',
}

export enum UpdatePasswordType {
  forgotPassword = 'forgotPassword',
  userAddedToOrganisation = 'userAddedToOrganisation',
}

export const LoginResponseCode: { [key: string]: ResponseCode } = {
  LOGIN_SUCCESS: {
    statusCode: 'LOGIN-001',
    message: 'Logged in successfully',
  },
  LOGIN_ONBOARD_PENDING: {
    statusCode: 'LOGIN-002',
    message: 'Please do complete the signup process',
  },
  MFA_AUTH_REQUIRED: {
    statusCode: 'LOGIN-003',
    message: 'Please do complete the MFA process',
  },
  MFA_SETUP_REQUIRED: {
    statusCode: 'LOGIN-004',
    message: 'Please do set up MFA',
  },
  VERIFICATION_PENDING: {
    statusCode: 'LOGIN-005',
    message: 'Please do verify your email',
  },
};

export const OnBoardResponseCode: { [key: string]: ResponseCode } = {
  ONBOARD_VERIFY_EMAIL: {
    statusCode: 'ONBOARD-001',
    message: 'Verification email sent.',
  },
  ONBOARD_GOOGLE_SUCCESS: {
    statusCode: 'ONBOARD-002',
    message: 'Google onboarding successful. Redirect to dashboard.',
  },
  ONBOARD_BILLING_EMAIL_VERIFICATION: {
    statusCode: 'ONBOARD-003',
    message: 'Redirect to billing. Then email verification.',
  },
  ONBOARD_BILLING_DASHBOARD: {
    statusCode: 'ONBOARD-004',
    message: 'Redirect to billing. Then dashboard.',
  },
};

export interface ResponseCode {
  statusCode: string;
  message: string;
}

export interface VerifyEmailTokenClaims {
  type: OnBoardingTokenType;
  entryId?: string;
  userOrgId?: string;
  userId?: string;
}

export interface ResendVerificationTokenClaims {
  type: OnBoardingTokenType;
  userId: string;
}

export interface UpdatePasswordTokenClaims {
  email: string;
  userOrgId?: string;
  type: UpdatePasswordType;
}

export interface ResendUpdatePasswordTokenClaims {
  email: string;
  type: UpdatePasswordType;
}

export interface OnBoardTokenClaims {
  entryId?: string;
  state?: string;
  type: OnBoardingTokenType;
  userOrgId?: string;
}

export interface TotpTokenClaims {
  userId: string;
  userOrgId: string;
}

export interface CollaboratorTokenClaims {
  userId: string;
  templateId?: string;
  collaboratorId?: string;
  contractId: string;
  type?: number;
}

export interface DownloadContractTokenClaims {
  signerId: string;
}

export interface OnBoardSubscriptionTokenClaims {
  orgId: string;
}

export interface UserOrganisationInviteTokenClaims {
  userOrgId: string;
}

export interface SingpassJWSIdTokenClaims {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  amr: string[];
  nonce: string;
}

export interface SingpassEmailConnectTokenClaims {
  entryId: string;
  email: string;
  userId: string;
}

export interface ContractDataCaptureTokenClaims {
  contractDataCaptureId: string;
}

export interface ResetMfaTokenClaims {
  userId: string;
  userOrgId: string;
  requestTime: Date;
}

export const nonSignupUserOrigins = [
  UserOrigin.ContractRecipient,
  UserOrigin.ShareRecipient,
  UserOrigin.Collaborator,
];

export const MAX_RESEND_MAIL_VERIFICATION_ATTEMPTS = 5;
export const RESEND_MAIL_VERIFICATION_WINDOW_HOURS = 24;

export const UNAUTHENTICATED_ERROR_MESSAGE =
  'Your session has expired. Please log in again to continue.';
