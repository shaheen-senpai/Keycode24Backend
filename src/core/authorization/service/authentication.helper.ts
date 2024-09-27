import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';

@Injectable()
export class AuthenticationHelper {
  constructor(private configService: ConfigService) {}

  /**
   * General function to create a signed JWT(same as compact serialized JWS)
   * @param dataToSign data to sign
   * @returns token
   */
  public async generateSignedJWT(dataToSign: ObjectLiteral) {
    const secret = this.configService.get('JWT_SECRET') as string;
    const response = await jwt.sign({ ...dataToSign }, secret);
    return response;
  }

  /**
   * General function to verify a signed JWT(same as compact serialized JWS)
   * @param dataToVerify data to verify
   * @returns payload
   */
  async verifySignedJWT(dataToVerify: string, ignoreExpiration = false) {
    const secret = this.configService.get('JWT_SECRET') || '';
    try {
      const res: any = jwt.verify(dataToVerify, secret, { ignoreExpiration });
      return res;
    } catch (err) {
      console.debug(err);
      throw new UnauthorizedException('Authentication token is invalid');
    }
  }
  async isPasswordValid(plainTextPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }
}
