import User from '../../../core/authorization/entity/user.entity';
import { TokenResponse } from '../../../customer-interface/schema/graphql.schema';

export interface UserAndOrgSignupInput {
  name: string;
  email: string;
  password: string;
  orgName: string;
  orgSize?: number;
  orgRole?: string;
}

export interface UserSignupOutput {
  statusCode: string;
  message: string;
  token: TokenResponse;
  qrImageUrl?: string;
  user: User;
}
