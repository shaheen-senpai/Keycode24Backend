import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import jose from 'node-jose';
import User from '../authorization/entity/user.entity';
import {
  AUTH_TOKEN,
  AuthTarget,
  COLLAB_AUTH_TOKEN,
  OnBoardSubscriptionTokenClaims,
  REFRESH_TOKEN,
  TokenType,
  UNAUTHENTICATED_ERROR_MESSAGE,
} from './constants/authentication.constants';
import { v4 as uuid } from 'uuid';
import { UserType } from '../../customer-interface/schema/graphql.schema';
import { ObjectLiteral } from 'typeorm';
import {
  ALG,
  CRV,
  KID_ENCRYPTION,
  KID_SIGNATURE,
  KTY,
  USE,
} from './constants/singapass.constants';
import {
  GeneralApplicationException,
  generalError,
} from '../../common/exception/general.application.exception';
import { AccessTokenData } from '../authorization/constants/authorization.constants';
import {
  ErrorCode,
  throwIntegrationError,
} from '../../common/exception/integration.error';
import UserOrganisation from '../authorization/entity/user.organisation.entity';
import { Request } from 'express';

@Injectable()
export class AuthenticationHelper {
  constructor(private configService: ConfigService) {}

  generateAccessToken(
    userDetails: User,
    userType: UserType = UserType.Customer,
    userOrg?: UserOrganisation,
  ) {
    const expiresIn =
      this.configService.get('JWT_TOKEN_EXPTIME') * 1 || 60 * 60;
    const secret = this.configService.get('JWT_SECRET') as string;
    const username = userDetails.id;

    const dataStoredInToken: ObjectLiteral = {
      username: username,
      sub: userDetails.id,
      env: this.configService.get('ENV') || 'local',
      tokenType: TokenType.AccessToken,
      userType,
      ...(userOrg && {
        userOrgId: userOrg.id,
        organisation: { id: userOrg.organisationId },
      }),
    };
    return jwt.sign(dataStoredInToken, secret, { expiresIn });
  }

  /**
   * Get organisation from Access token OR temp token
   * @param accessData
   * @returns
   */
  async getOrganisationIdForUser(accessData: AccessTokenData | string) {
    if (typeof accessData == 'string') {
      const claims: OnBoardSubscriptionTokenClaims = await this.verifySignedJWT(
        accessData,
        TokenType.OnBoardSubscriptionToken,
      );
      if (!claims.orgId) {
        throw new GeneralApplicationException('user organisation is not found');
      }
      return claims.orgId;
    }
    // creating a customer for the normal checkoutUrl flow
    else {
      return accessData.organisation?.id;
    }
  }

  generateRefreshToken(
    userDetails: User,
    userType: UserType = UserType.Customer,
    userOrg?: UserOrganisation,
  ) {
    const expiresIn =
      this.configService.get('JWT_REFRESH_TOKEN_EXP_TIME') * 1 || 60 * 60;
    const secret = this.configService.get('JWT_SECRET') as string;

    const dataStoredInToken = {
      sub: userDetails.id,
      env: this.configService.get('ENV') || 'local',
      tokenType: TokenType.RefreshToken,
      refreshId: uuid(),
      userType,
      ...(userOrg && { userOrgId: userOrg.id }),
    };
    return {
      refreshId: dataStoredInToken.refreshId,
      refreshToken: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }

  generateTokenForUser(
    userDetails: User,
    userType: UserType = UserType.Customer,
    userOrg?: UserOrganisation,
  ) {
    const accessToken = this.generateAccessToken(
      userDetails,
      userType,
      userOrg,
    );
    const { refreshToken, refreshId } = this.generateRefreshToken(
      userDetails,
      userType,
      userOrg,
    );
    return { accessToken, refreshToken, refreshId };
  }

  validateAuthToken(
    authorization: string,
    tokenType: TokenType,
    target = AuthTarget.User,
  ) {
    const secret = this.configService.get('JWT_SECRET') || '';
    const reqAuthToken = authorization;
    const verify = () => {
      try {
        const res = jwt.verify(reqAuthToken, secret);
        return res;
      } catch (err) {
        console.debug(err);
        throw new UnauthorizedException(UNAUTHENTICATED_ERROR_MESSAGE);
      }
    };
    const verificationResponse: any = verify();
    const env = this.configService.get('ENV') || 'local';
    if (
      verificationResponse.env !== env ||
      verificationResponse.tokenType !== tokenType ||
      (target === AuthTarget.Organisation && !verificationResponse.userOrgId)
    ) {
      throw new UnauthorizedException();
    }
    const user = { ...verificationResponse, id: verificationResponse.sub };
    return user;
  }

  async isPasswordValid(plainTextPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async generatePasswordHash(plainTextPassword: string, salt = 10) {
    return bcrypt.hash(plainTextPassword, salt);
  }

  getAccessTokenCookieName(
    userType: UserType = UserType.Customer,
    tokenType: TokenType = TokenType.AccessToken,
  ) {
    return `${
      tokenType === TokenType.AccessToken ? AUTH_TOKEN : COLLAB_AUTH_TOKEN
    }-${userType}-${this.configService.get('ENV')}`;
  }

  getRefreshTokenCookieName(userType: UserType = UserType.Customer) {
    return `${REFRESH_TOKEN}-${userType}-${this.configService.get('ENV')}`;
  }

  /**
   * Builds application's signature and encryption public+private key sets.
   */
  async generateKeySets(): Promise<jose.JWK.KeyStore> {
    const signatureKey = await this.generateJWKKey(USE.sig);
    const encryptionKey = await this.generateJWKKey(USE.enc);
    const keyStore = jose.JWK.createKeyStore();
    await keyStore.add(signatureKey);
    await keyStore.add(encryptionKey);
    return keyStore;
  }

  /**
   *Constructs and returns client_assertion JWT signed with application's signature private key.
   */
  async generateClientAssertionJWT(
    signaturePvtKey: jose.JWK.Key,
    header: { typ: string; alg: string; kid: string },
    claims: { sub: string; aud: string; iss: string; iat: number; exp: number },
  ) {
    try {
      const resp = jose.JWS.createSign(
        { fields: header, format: 'compact' },
        signaturePvtKey,
      )
        .update(Buffer.from(JSON.stringify(claims))) //TODO: use stringified claims itself instead of Buffer?
        .final()
        .then((result) => result); //TODO :use await?
      return resp;
    } catch (error) {
      throwIntegrationError(ErrorCode.SP_003, error);
    }
  }

  /**
   * Decrypts JWE token.
   * @param idToken token to be decrypted
   * @param encryptionPvtKey application's encryption private key
   * @returns payload in the token
   */
  async decryptJWE(idToken: string, encryptionPvtKey: jose.JWK.Key) {
    try {
      const payload = await jose.JWE.createDecrypt(encryptionPvtKey)
        .decrypt(idToken)
        .then((result) => result.plaintext.toString());
      /* {result} is a Object with:
       *  header: the combined 'protected' and 'unprotected' header members
       *  protected: an array of the member names from the "protected" member
       *  key: Key used to decrypt
       *  payload: Buffer of the decrypted content
       *  plaintext: Buffer of the decrypted content (alternate)
       */
      //TODO: use either await or .then()?
      return payload;
    } catch (error) {
      generalError('Token decryption failed!');
    }
  }

  /**
   * Verify JWS
   * @param jws JWS to be verified
   * @param signaturePublicKey signature public key of the system that signed the JWS
   */
  async verifyJWS(code: string, signaturePublicKey: jose.JWK.Key) {
    let payload;
    try {
      // const resp = jose.JWS.createVerify(signaturePublicKey)
      //   .verify(code)
      //   .then(function (result) {
      //     return result;
      //   });
      // return resp;
      payload = await jwt.decode(code); //TODO: verify (using node-jose)instead of decode
    } catch (error) {
      generalError('Token verification failed!');
    }
    if (!payload) {
      generalError('No paylod found in token!');
    }
    return payload;
  }

  /**
   * Generates an application JWK key.
   * @param use usage of the key(signature or encryption)
   */
  async generateJWKKey(use: string): Promise<jose.JWK.Key> {
    const key: ObjectLiteral = {
      kty: KTY.EC,
      use: use,
      crv: CRV.P256,
    };
    if (use === USE.sig) {
      key.kid = KID_SIGNATURE;
      key.x = this.configService.get('SIGNATURE_PUBLIC_KEY_X');
      key.y = this.configService.get('SIGNATURE_PUBLIC_KEY_Y');
      key.d = this.configService.get('SIGNATURE_PRIVATE_KEY_D');
      key.alg = ALG.ES256;
    } else if (use === USE.enc) {
      key.kid = KID_ENCRYPTION;
      key.x = this.configService.get('ENCRYPTION_PUBLIC_KEY_X');
      key.y = this.configService.get('ENCRYPTION_PUBLIC_KEY_Y');
      key.d = this.configService.get('ENCRYPTION_PRIVATE_KEY_D');
      key.alg = ALG.ECDH;
    }
    return await jose.JWK.asKey(key);
  }

  /**
   * General function to create a signed JWT(same as compact serialized JWS)
   * @param dataToSign data to sign
   * @returns token
   */
  public async generateSignedJWT(
    dataToSign: ObjectLiteral,
    tokenType: TokenType,
  ) {
    const secret = this.configService.get('JWT_SECRET') as string;
    const response = await jwt.sign({ ...dataToSign, tokenType }, secret);
    return response;
  }

  /**
   * General function to verify a signed JWT(same as compact serialized JWS)
   * @param dataToVerify data to verify
   * @returns payload
   */
  async verifySignedJWT(
    dataToVerify: string,
    tokenType: TokenType,
    ignoreExpiration = false,
  ) {
    const secret = this.configService.get('JWT_SECRET') || '';
    try {
      const res: any = jwt.verify(dataToVerify, secret, { ignoreExpiration });
      if (res?.tokenType !== tokenType) throw new UnauthorizedException();
      return res;
    } catch (err) {
      console.debug(err);
      throw new UnauthorizedException('Authentication token is invalid');
    }
  }

  async generateNativeSignUpVerificationLink(token: string) {
    const link = `${this.configService.get(
      'APP_URL',
    )}/ums/api/user/verify?token=${token}`;
    return link;
  }

  /**
   * Method to do get token from request. It can be cookie token or header token
   */
  async extractTokenFromRequest(
    request: Request,
    platform: UserType,
    tokenType: TokenType,
    considerQueryParams = false,
  ) {
    const token =
      request.signedCookies?.[
        this.getAccessTokenCookieName(platform, tokenType)
      ] ||
      request.headers.authorization?.split(' ')[1] ||
      (considerQueryParams ? (request.query?.token as string) : null);
    return token;
  }

  /**
   * function to create a token for word pluggin in CkEditor
   */
  async genearteCKEditorImportWordAuthToken() {
    const payload = {
      aud: this.configService.get('CK_EDITOR_ENV_ID'),
      sub: 'scribezero',
      auth: {
        collaboration: {
          '*': {
            role: 'writer',
          },
        },
      },
    };
    const result = jwt.sign(
      payload,
      this.configService.get('CK_EDITOR_WORD_ACCESS_KEY') as string,
      {
        algorithm: 'HS256',
        expiresIn: '24h',
      },
    );
    return result;
  }
}
