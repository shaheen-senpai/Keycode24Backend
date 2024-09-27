import Joi from 'joi';

export const UpdateOrganisationClauseSchema = Joi.object({
  htmlHeight: Joi.number().integer().max(155),
}).options({ abortEarly: false, allowUnknown: true });
