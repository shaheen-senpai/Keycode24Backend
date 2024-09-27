import Joi from 'joi';
import {
  passwordValidation,
  emailValidation,
  userNameValidation,
  userFullNameValidation,
} from '../../../common/utils/validation.utils';

// Deprecated
export const SignupInputValidation = Joi.object({
  name: userNameValidation(),
  email: emailValidation().required(),
  password: passwordValidation(),
})
  .options({ abortEarly: false, allowUnknown: true })
  .or('email', 'phone');

export const UserSignupInputValidation = Joi.object({
  name: userFullNameValidation().required(),
  email: emailValidation().required(),
  password: passwordValidation(),
}).options({ abortEarly: false, allowUnknown: true });

export const ForgotPasswordInputValidation = Joi.object({
  email: emailValidation().required(),
}).options({ abortEarly: false });

export const UserLoginInputValidation = Joi.object({
  username: emailValidation(),
  password: Joi.string().trim().required(),
}).options({ abortEarly: false });

export const UpdatePasswordInputValidation = Joi.object({
  password: passwordValidation(),
}).options({ abortEarly: false, allowUnknown: true });

export const UserPasswordInputSchema = Joi.object({
  currentPassword: Joi.string().required().min(10),
  newPassword: Joi.string()
    .disallow(Joi.ref('currentPassword'))
    .required()
    .min(10),
}).options({ abortEarly: false });

export const GoogleUserSchema = Joi.object({
  email: emailValidation().required(),
  firstName: Joi.string().required(),
  middleName: Joi.string(),
  lastName: Joi.string().required(),
  externalUserId: Joi.string().required(),
}).options({ abortEarly: false });

export const OnBoardInputValidation = Joi.object({
  individualDetails: Joi.object({
    legalName: Joi.string().trim().required().max(255),
    firstName: userNameValidation().required(),
    lastName: userNameValidation().required(),
    email: emailValidation(),
    countryId: Joi.string().trim().required(),
  }),
  organisationDetails: Joi.object({
    legalName: Joi.string().trim().required().max(255),
    firstName: userNameValidation().required(),
    lastName: userNameValidation().required(),
    industry: Joi.string().trim(),
    role: Joi.string().trim(),
    countryId: Joi.string().trim(),
  }),
}).options({ abortEarly: false, allowUnknown: true });
