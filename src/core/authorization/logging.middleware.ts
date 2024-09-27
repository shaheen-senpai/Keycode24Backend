import { getNamespace, Namespace } from 'cls-hooked';
import { Request, Response, NextFunction } from 'express';
import { GeneralApplicationException } from 'src/common/exception/general.application.exception';
import { v4 } from 'uuid';
import { Logging } from './constants/logging.constants';

export const requestIdBinder = (ns: Namespace) => {
  if (!ns) throw new GeneralApplicationException('CLS namespace required');

  return function classifyMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    ns.bindEmitter(req);
    ns.bindEmitter(res);

    ns.run(() => {
      let requestId = req.headers['x-amzn-trace-id'];
      if (!requestId) {
        requestId = v4();
      }

      const appNameSpace = getNamespace(Logging.LogNameSpace);
      appNameSpace && appNameSpace.set('requestId', requestId);
      next();
    });
  };
};
