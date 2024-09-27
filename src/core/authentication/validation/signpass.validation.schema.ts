import Joi from 'joi';
import { emailValidation } from '../../../common/utils/validation.utils';

export const ConnectEmailWithSingpassForExistingUserInputValidation =
  Joi.object({
    email: emailValidation().required(),
  }).options({ abortEarly: false, allowUnknown: true });
