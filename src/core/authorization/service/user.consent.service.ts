import { Injectable } from '@nestjs/common';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { get } from 'express-http-context';
import { BaseService } from '../../../common/utils/base.service';
import UserConsent from '../entity/user.consent.entity';
import { RequestDetails } from '../../../common/decorator/custom.transactional.constants';
import { getUserDeviceInformation } from '../../../common/utils/general.utils';
import IPAPIService from '../../../core/authentication/service/ipapi.service';

@Injectable()
export default class UserConsentService extends BaseService<UserConsent> {
  constructor(
    @InjectRepository(UserConsent)
    private userConsentRepository: Repository<UserConsent>,
    private ipapiService: IPAPIService,
  ) {
    super(userConsentRepository);
  }
  /**
   * To save user consent object
   * @param userConsentObj
   * @returns user consent object
   */
  async saveUserConsent(userConsentObj: DeepPartial<UserConsent>) {
    return await this.userConsentRepository.save(userConsentObj);
  }

  /**
   * To add user consent once a user is verified
   * @param userId
   * @returns user consent object
   */
  public async addUserConsent(userId: string) {
    const userConsent = await this.findOne({ where: { userId } });
    if (userConsent) return;
    const { ip, userAgent } = get(RequestDetails);
    const ipData = {
      ...(await this.ipapiService.getGeoLocation(ip)),
      ...getUserDeviceInformation(userAgent),
    };
    return await this.saveUserConsent({ userId, ipData });
  }
}
