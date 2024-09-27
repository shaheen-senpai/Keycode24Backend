import Joi from 'joi';
import {
  emailValidation,
  entityNameValidation,
} from '../../../common/utils/validation.utils';
import { Industry } from '../constants/onboarding.constants';

export const UpdateOrganisationInputValidation = Joi.object({
  name: entityNameValidation().required(),
  email: emailValidation().allow(''),
  uenNumber: Joi.string().allow('').trim().max(255),
  industry: Joi.string()
    .allow(null)
    .valid(...Object.values(Industry)),
}).options({ abortEarly: false, allowUnknown: true });
