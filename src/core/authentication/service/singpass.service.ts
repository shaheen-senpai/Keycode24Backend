import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Transactional } from 'typeorm-transactional';
import { RedisCacheService } from '../../../common/cache/redis-cache/redis-cache.service';
import UserService from '../../authorization/service/user.service';
import { AuthenticationHelper } from '../authentication.helper';
import jose from 'node-jose';
import {
  ALG,
  KID_ENCRYPTION,
  KID_SIGNATURE,
  TOKEN_TYPE,
} from '../constants/singapass.constants';
import { concatNames } from '../../../common/utils/string.utils';
import { SingpassHelper } from '../singpass.helper';
import { SingpassInfo } from '../types/singpass.types';
import { StateNonceService } from '../../authorization/service/state.nonce.service';
import { catchError, lastValueFrom, map } from 'rxjs';
import UserLinkedAccounts from '../../authorization/entity/user.linked.accounts.entity';
import { UserLinkedAccountsService } from '../../authorization/service/userLinkedAccounts.service';
import { LinkedAccountPlatform } from '../../../admin-interface/schema/graphql.schema';
import {
  ConnectEmailInput,
  LinkedAccountType,
  OnBoardingTokenType,
} from '../../../customer-interface/schema/graphql.schema';
import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import { EntityNotFoundError, ObjectLiteral } from 'typeorm';
import User from '../../authorization/entity/user.entity';
import { SingpassMailService } from '../../email/service/singpass.mail.service';
import { LoggerService } from '../../../common/logger/logger.service';
import {
  OnBoardTokenClaims,
  SingpassEmailConnectTokenClaims,
  SingpassJWSIdTokenClaims,
  TokenType,
} from '../constants/authentication.constants';
import { EnableLog } from '../../authorization/logging.decorator';
import {
  ErrorCode,
  throwIntegrationError,
} from '../../../common/exception/integration.error';
import UserauthService from './userauth.service';

@Injectable()
export class SingpassService implements OnModuleInit {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private authenticationHelper: AuthenticationHelper,
    private singpassHelper: SingpassHelper,
    private cacheManager: RedisCacheService,
    private httpService: HttpService,
    private stateNonceService: StateNonceService,
    private userLinkedAccountsService: UserLinkedAccountsService,
    private singpassMailService: SingpassMailService,
    private loggerService: LoggerService,
    private userauthService: UserauthService,
  ) {}

  // The singpass signature public key has expired so the below function has been commented out
  async onModuleInit() {
    // Promise.all([this.getKeyStore, this.getSingpassInfo]);
    // await this.getSingpassSignaturePublicKey();
  }

  /**
   * Validates the state, creates client assertion token signed by application's signature pvt key.
   * Invokes singpass token endpoint with this token.
   * The response is then decrypted(using application's encryption pvt key) to get the user details.
   * The token and nonce in the response is verified/validated.
   * If its a new user, adds an entry in userLinkedAccounts table with
   *  the unique user id obtained from singpass and generates signedJWT with details.
   * If there is already an entry in userlogin table, but the singpassId is not verified,
   *  then generate the signedJWT with details.
   * TODO:
   * If the singpassId is already linked & verified, redirect to dashboard.
   * Returns a signed JWT with the entry id and unique user id in payload.
   * @param authorizationCode authorization code received from singpass used to create client assertion token
   * @param state
   * @returns a Signed JWT and the action to perform
   */
  @Transactional()
  @EnableLog()
  async singpassLogin(authorizationCode: string, state: string) {
    const stateNonceObj = await this.stateNonceService.findOneByState(state);
    // For debugging
    if (
      stateNonceObj?.data?.stop &&
      this.configService.get('ENV') === 'develop'
    )
      return { action: 'addEmail', signedJWT: authorizationCode };
    // validate state
    this.stateNonceService.validateState(stateNonceObj);

    //application's keys:
    const keyStore: jose.JWK.KeyStore = await this.getKeyStore();
    const signaturePvtKey = keyStore.get(KID_SIGNATURE);
    const encryptionPvtKey = keyStore.get(KID_ENCRYPTION);
    //singpass's signature public key:
    const singpassSignaturePublicKey =
      await this.getSingpassSignaturePublicKey();

    //create client assertion token
    const header = this.getHeader();
    const claims = await this.getClaims();
    const clientAssertionToken =
      await this.authenticationHelper.generateClientAssertionJWT(
        signaturePvtKey,
        header,
        claims,
      );

    //invoke token endpoint with the client assertion token
    const responseData = await this.invokeTokenEndpoint(
      authorizationCode,
      clientAssertionToken,
    );

    //decrypt JWE
    const jws = await this.authenticationHelper.decryptJWE(
      responseData.id_token,
      encryptionPvtKey,
    );
    this.loggerService.info(`jws:${jws}`);

    //verify the JWS in JWE
    const payload: SingpassJWSIdTokenClaims =
      (await this.authenticationHelper.verifyJWS(
        jws,
        singpassSignaturePublicKey,
      )) as SingpassJWSIdTokenClaims;
    //validating nonce
    await this.stateNonceService.validateNonce(stateNonceObj, payload.nonce);

    /* const samplePayload = {
      sub: 's=S3002700J,u=1cb0b69b-a53d-4d86-8d47-f9a67f35ebaf',
      aud: 'rBPBmfu8Bc3VzY3pe7inRhioZS8Vw09r',
      amr: ['pwd', 'swk'],
      iss: 'https://stg-id.singpass.gov.sg',
      exp: 1647255780,
      iat: 1647255180,
      nonce: '33982690-46a9-470e-96e4-aebd1676fa40',
    }; */
    const [uuidFromSingpass, sidFromSingpass] = this.getUniqueIdsFromClaims(
      payload.sub,
    );

    //check if this singpassId is already linked or is attempted to link
    const existingEntry = await this.userLinkedAccountsService.findOne({
      where: { uniqueid: uuidFromSingpass },
      relations: ['user'],
    });
    if (existingEntry?.isLinkVerified && existingEntry.user) {
      // CASE: Singpass Id already linked. Redirect to dashboard.
      return {
        action: 'dashboard',
        user: await this.userService.getUserDetailsForToken({
          id: existingEntry.userId,
        }),
      };
    } else {
      let entry: UserLinkedAccounts;
      if (!existingEntry) {
        //CASE: New Singpass account | No existing linking attempt found
        const newEntry = {
          uniqueid: uuidFromSingpass,
          platform: LinkedAccountPlatform.Singpass,
          isLinkVerified: false,
          type: LinkedAccountType.Auth,
        } as UserLinkedAccounts;
        sidFromSingpass && (newEntry.data = { s: sidFromSingpass }); // uuid will be always present ,unlike sId
        entry = await this.userLinkedAccountsService.save(newEntry);
      } else {
        //CASE: Existing linking attempt found
        entry = existingEntry;
      }
      const claims: OnBoardTokenClaims = {
        entryId: entry.id,
        type: OnBoardingTokenType.Singpass,
      };
      stateNonceObj.data?.planDetail && (claims.state = stateNonceObj.state);
      const signedJWT = await this.authenticationHelper.generateSignedJWT(
        claims,
        TokenType.OnboardToken,
      );
      //Redirect to email linking page with this token
      return {
        action: 'addEmail',
        signedJWT,
        plan: stateNonceObj.data?.planDetail?.plan,
      };
    }
  }

  getUniqueIdsFromClaims(sub: string) {
    const uuidRegex = /u=([a-zA-Z0-9-]*)/g;
    const sidRegex = /s=([a-zA-Z0-9-]*)/g; //TODO: can be reduced to one regex with named groups
    const uuidResultArray = sub.match(uuidRegex);
    const sidResultArray = sub.match(sidRegex);
    return [uuidResultArray?.[0].slice(2), sidResultArray?.[0].slice(2)]; // returns the first match after removing 'u=' and 's='
  }

  /**
   * To get the KeyStore(collection of keys) of application.
   * Generates the application's signature and encryption key sets.
   */
  @EnableLog()
  async getKeyStore(): Promise<jose.JWK.KeyStore> {
    return await this.authenticationHelper.generateKeySets();
  }

  /**
   *Returns singpass info from cache. If not found, get the same from singpass's endpoint.
   */
  @EnableLog()
  async getSingpassInfo(): Promise<SingpassInfo> {
    const singpassInfoFromCache = await this.cacheManager.get<SingpassInfo>(
      'SINGPASS_INFO',
    );
    const singpassInfo =
      singpassInfoFromCache || (await this.singpassHelper.getSingpassInfo());

    singpassInfoFromCache ||
      (await this.cacheManager.set('SINGPASS_INFO', singpassInfo));

    return singpassInfo;
  }

  /**
   * Invokes the singpass token endpoint with the client assertion token and returns the result.
   * @param code authorization code received from singpass
   * @param clientAssertionToken client assertion token signed by application's signature pvt key
   */
  async invokeTokenEndpoint(
    code: string,
    clientAssertionToken: any, //TODO:change to JWT token type.
  ) {
    //construct headers and request params
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      charset: 'ISO-8859-1',
    };
    const params = {
      client_id: this.configService.get('SINGPASS_CLIENT_ID'),
      redirect_uri: `${this.configService.get(
        'APP_URL',
      )}/ums/api/singpass/redirect`,
      grant_type: 'authorization_code',
      code,
      client_assertion_type:
        'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertionToken,
    };
    const reqParams = `client_id=${params.client_id}&grant_type=${params.grant_type}&redirect_uri=${params.redirect_uri}&client_assertion=${params.client_assertion}&client_assertion_type=${params.client_assertion_type}&code=${params.code}`;

    // get singpass token endpoint url
    const singpassTokenEndpoint = (await this.getSingpassInfo()).token_endpoint; //TODO:resuse previoius result?
    // invoke token endpoint
    const data = await lastValueFrom(
      this.httpService
        .post(singpassTokenEndpoint, reqParams, { headers })
        .pipe(map((resp) => resp.data))
        .pipe(
          catchError((error) => {
            throwIntegrationError(ErrorCode.SP_004, error);
          }),
        ),
    );
    return data;
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
    const singpassInfo = await this.singpassHelper.getSingpassInfo();
    const claims = {
      sub: this.configService.get('SINGPASS_CLIENT_ID'),
      aud: singpassInfo.issuer,
      iss: this.configService.get('SINGPASS_CLIENT_ID'),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    };
    return claims;
  }

  /**
   * Retrieves the singpass signature public key from cache.
   * If not found, fetches it from singpass endpoint, caches it and returns the same.
   * @returns singpass' signature public key
   */
  async getSingpassSignaturePublicKey() {
    const NDIKeyFromCache = await this.cacheManager.get<jose.JWK.Key>(
      'NDI_JW_KEY',
    );
    const NDIKey =
      NDIKeyFromCache ||
      (await this.singpassHelper.getSingpassSignaturePublicKey());
    NDIKeyFromCache || (await this.cacheManager.set('NDI_JW_KEY', NDIKey));
    return NDIKey;
  }

  /**
   * To connect Email With Singpass For Existing User
   * @param input ConnectEmailInput
   */
  @EnableLog()
  async connectEmailWithSingpassForExistingUser(input: ConnectEmailInput) {
    const payload: OnBoardTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        input.token,
        TokenType.OnboardToken,
      );
    const userLinkedAccountEntry = await this.userLinkedAccountsService.findOne(
      {
        where: {
          id: payload.entryId,
          platform: LinkedAccountPlatform.Singpass,
        },
      },
    );
    const user = await this.userService.getUserByCondition({
      email: input.email,
    });
    this.validateUserAndUserLinkedAccount(
      user,
      { email: input.email },
      userLinkedAccountEntry,
      { id: payload.entryId },
    );
    //CASE: User found and is not linked with any SingpassID.
    const signedJWT = await this.authenticationHelper.generateSignedJWT(
      {
        entryId: userLinkedAccountEntry?.id,
        email: input.email,
        userId: user?.id,
      } as SingpassEmailConnectTokenClaims,
      TokenType.SingpassEmailConnectToken,
    );
    const verificationLink =
      this.singpassHelper.generateVerificationLink(signedJWT);
    await this.singpassMailService.sentVerificaitonMail(
      input.email,
      concatNames(user?.firstName as string, user?.lastName),
      verificationLink,
    );
    const message = 'Verification mail has been successfully sent';
    return { message };
  }

  /**
   * To verify User using token
   * @param token
   */
  @Transactional()
  @EnableLog()
  async verifyLink(token: string) {
    const payload: SingpassEmailConnectTokenClaims =
      await this.authenticationHelper.verifySignedJWT(
        token,
        TokenType.SingpassEmailConnectToken,
      );

    let userLinkedAccountEntry: any =
      await this.userLinkedAccountsService.findOne({
        where: {
          id: payload.entryId,
          platform: LinkedAccountPlatform.Singpass,
        },
      });
    //Fetching all required info of user to create token for user on success, to avoid extra DB call.
    const user = await this.userService.getUserDetailsForToken({
      id: payload.userId,
      email: payload.email,
    });
    if (!user || !user.firstName) {
      return {
        action: 'error',
        message: 'Please complete user onboarding and try again',
      };
    }
    this.validateUserAndUserLinkedAccount(
      user,
      { id: payload.userId, email: payload.email },
      userLinkedAccountEntry,
      { id: payload.entryId },
    );
    userLinkedAccountEntry = {
      ...userLinkedAccountEntry,
      isLinkVerified: true,
      userId: user.id,
    };
    await this.userLinkedAccountsService.save(userLinkedAccountEntry);
    await this.userauthService.isOkForVerify(user);
    await this.userService.updateUser(user.id, { isEmailVerified: true });
    return { action: 'dashboard', user };
  }

  /**
   * To validate user and userLinkedAccount entry
   * @param user
   * @param userConditions
   * @param userLinkedAccountEntry
   * @param entryConditions
   */
  @EnableLog()
  validateUserAndUserLinkedAccount(
    user: User | null,
    userConditions: ObjectLiteral,
    userLinkedAccountEntry: UserLinkedAccounts | null,
    entryConditions: ObjectLiteral,
  ) {
    if (!user) {
      if (!('id' in userConditions) && 'email' in userConditions) {
        throw new GeneralApplicationException(
          'The entered email is not registered',
        );
      } else {
        throw new GeneralApplicationException('User not found');
      }
    }
    if (!userLinkedAccountEntry) {
      throw new EntityNotFoundError(UserLinkedAccounts, entryConditions);
    }
    if (userLinkedAccountEntry.isLinkVerified) {
      throw new GeneralApplicationException('Singpass ID is already connected');
    }
    if (
      user.userLinkedAccounts?.find((el) => {
        el.platform === LinkedAccountPlatform.Singpass && el.isLinkVerified;
      })
    ) {
      throw new GeneralApplicationException(
        'User is already linked to another SingpassID',
      );
    }
    return { user, userLinkedAccountEntry };
  }
}
