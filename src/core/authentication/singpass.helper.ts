import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import jose from 'node-jose';
import { lastValueFrom, map } from 'rxjs';
import {
  ErrorCode,
  throwIntegrationError,
} from '../../common/exception/integration.error';
import {
  ALG,
  KID_SIGNATURE,
  TOKEN_TYPE,
  USE,
} from './constants/singapass.constants';
import { SingpassInfo } from './types/singpass.types';

@Injectable()
export class SingpassHelper {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Retrieves singpass info from Singpass' OpenId Discovery endpoint.
   */
  async getSingpassInfo(): Promise<SingpassInfo> {
    const openDiscoveryEndpoint = this.configService.get(
      'OPEN_ID_DISCOVERY_ENDPOINT',
    );
    try {
      const data: SingpassInfo = await lastValueFrom(
        this.httpService
          .get(openDiscoveryEndpoint)
          .pipe(map((resp) => resp.data)),
      );
      return data;
    } catch (error) {
      throwIntegrationError(ErrorCode.SP_001, error);
    }
  }

  /**
   * Returns singpass' signature public key from singpass' JWKS endpoint
   */
  async getSingpassSignaturePublicKey(): Promise<jose.JWK.Key> {
    try {
      const singpassKeysURI = (await this.getSingpassInfo()).jwks_uri; // TODO:reuse preivous result...
      const data: { keys: jose.JWK.RawKey[] } = await lastValueFrom(
        this.httpService.get(singpassKeysURI).pipe(map((resp) => resp.data)),
      );
      const singpassSignaturePublicKey = data.keys.find(
        (key) => key.use === USE.sig,
      );
      if (!singpassSignaturePublicKey) {
        throw new Error('Singpass signature public key not found'); //TODO :what to throw exactly?
      }
      return await jose.JWK.asKey(singpassSignaturePublicKey);
    } catch (error) {
      throwIntegrationError(ErrorCode.SP_002, error);
    }
  }

  /**
   * Constructs and returns the header for the client assertion token
   */
  getHeader() {
    const header = {
      typ: TOKEN_TYPE.JWT,
      alg: ALG.ES256,
      kid: KID_SIGNATURE,
    };
    return header;
  }

  /**
   * Constructs and returns the claims for the client assertion token
   */
  async getClaims() {
    const singpassInfo = await this.getSingpassInfo(); // TODO: reuse preivous result...
    const claims = {
      sub: this.configService.get('SINGPASS_CLIENT_ID'),
      aud: singpassInfo.token_endpoint,
      iss: this.configService.get('SINGPASS_CLIENT_ID'),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    return claims;
  }

  async generateSignedJWTForEmailAddition(
    sigPvtKey: jose.JWK.Key,
    entryId: string,
  ) {
    const header = this.getHeader();
    const claims = {
      entryId,
    };
    const jws = await jose.JWS.createSign(
      { fields: header, format: 'compact' },
      sigPvtKey,
    )
      .update(JSON.stringify(claims), 'utf8')
      .final();
    return jws;
  }

  generateVerificationLink(token: string) {
    const link = `${this.configService.get(
      'APP_URL',
    )}/ums/api/singpass/verify?token=${token}`;
    return link;
  }
}
