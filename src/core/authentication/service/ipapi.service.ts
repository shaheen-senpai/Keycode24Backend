import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  ErrorCode,
  throwIntegrationError,
} from '../../../common/exception/integration.error';

@Injectable()
export default class IPAPIService {
  private readonly apiUrl = this.configService.get('IPAPI_URL');

  constructor(private configService: ConfigService) {}

  async getGeoLocation(ip: string) {
    const url = `${this.apiUrl}/${ip}/json`;
    const result = await axios
      .get(url)
      .catch((error) => throwIntegrationError(ErrorCode.IP_001, error));
    if (result.status !== 200) return {};
    return result.data;
  }
}
