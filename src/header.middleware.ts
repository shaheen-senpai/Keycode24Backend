import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { set } from 'express-http-context';
import { RequestDetails } from './common/decorator/custom.transactional.constants';

@Injectable()
export class HeaderMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers['x-forwarded-for'] || req.headers['ip'];
    const userAgent = req.headers['user-agent'];
    set(RequestDetails, { ip, userAgent });
    next();
  }
}
