import Joi from 'joi';
import {
  emailValidation,
  entityNameValidation,
  passwordValidation,
  userNameValidation,
} from '../../../common/utils/validation.utils';
import { CountRangeResolver } from '../../../customer-interface/authentication/enum/count.range.enum';

export const UpdateUserSchema = Joi.object({
  name: Joi.string().allow('').trim().max(60),
  firstName: userNameValidation().required(),
  lastName: userNameValidation().required(),
  nationalId: Joi.string().allow('').trim().max(255),
  dob: Joi.date().allow(null),
  address: Joi.string().allow('').trim().max(255),
  gender: Joi.string().allow('').trim().max(255),
  phone: Joi.string().allow('').trim().max(255),
}).options({ abortEarly: false, allowUnknown: true });

export const CreateUserWithRoleValidator = Joi.object({
  email: emailValidation(),
  firstName: userNameValidation().required(),
  lastName: userNameValidation().required(),
}).options({ abortEarly: false, allowUnknown: true });

export const RequestDemoSchema = Joi.object({
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: emailValidation().required(),
  companyName: Joi.string(),
  jobTitle: Joi.string(),
  message: Joi.string(),
  action: Joi.string(),
}).options({ abortEarly: false, allowUnknown: true });

export const UserAndOrgSignUpSchema = Joi.object({
  email: emailValidation().required(),
  name: userNameValidation().required(),
  password: passwordValidation().required(),
  orgName: entityNameValidation().required(),
  orgSize: Joi.number()
    .allow(null)
    .valid(...Object.values(CountRangeResolver)),
  orgRole: Joi.string().allow(''),
}).options({ abortEarly: false, allowUnknown: true });
