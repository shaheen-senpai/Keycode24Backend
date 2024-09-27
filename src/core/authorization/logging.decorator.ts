import { getNamespace } from 'cls-hooked';
import { Logging } from './constants/logging.constants';
import { Logger } from '@nestjs/common';
export const circularObjToString = () => {
  const visited = new WeakSet();
  return (key: any, value: Record<string, unknown> | null) => {
    if (typeof value === 'object' && value !== null) {
      if (visited.has(value)) {
        return;
      }
      visited.add(value);
    }
    return value;
  };
};

export function EnableLog(errorLog = true) {
  return (
    target: any,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor,
  ) => {
    const className = target.constructor.name;
    const originalMethod = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args: any) {
      try {
        args.myself = args;
        const applicationNamespace = getNamespace(Logging.LogNameSpace);
        const traceId = applicationNamespace?.get('requestId');
        Logger.log(
          `${traceId}: ${propertyKey}: START called with Args ${JSON.stringify(
            args,
            circularObjToString(),
          )}`,
          className,
        );
        const result = await originalMethod.apply(this, args);
        Logger.log(`${traceId}: ${propertyKey}: END`, className);
        return result;
      } catch (error) {
        const applicationNamespace = getNamespace(Logging.LogNameSpace);
        const traceId = applicationNamespace?.get('requestId');
        Logger.error(
          `${traceId}: ${propertyKey}: ERROR with status: ${error.status} and error: ${error.message}`,
          undefined,
          className,
        );

        // rethrow error, so it can bubble up
        if (errorLog) {
          throw error;
        }
      }
    };
  };
}
