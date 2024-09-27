import { InvalidPayloadException } from '../../common/exception/invalid.payload.exception';
import { ObjectLiteral } from 'typeorm';
import Joi from 'joi';
import moment from 'moment';

/**
 * Function is to validate input type againt a Joi schema validation object
 * @param schema - Joi validation Object, input: graphql input type
 * @returns The same graphql type recieved
 */
export const validate = async (
  schema: any,
  input: ObjectLiteral,
): Promise<any> => {
  try {
    // validateAsync is used to get modified result.
    // Eg - if trim applied on a field, retured object will contain trimmed value
    const data = await schema.validateAsync(input);
    return data;
  } catch (error) {
    const { details } = error;
    const message = details.length ? details[0].message : 'Validation failed';
    throw new InvalidPayloadException(message);
  }
};

export const emailValidation = () => {
  return Joi.string().trim().lowercase().email({ tlds: false }).max(320);
};

export const variableValuesValidation = () => {
  return Joi.array().items(
    Joi.object({
      value: Joi.string().trim().allow(null).allow('').max(2047),
    }),
  );
};

export const passwordValidation = () => {
  return Joi.string()
    .trim()
    .required()
    .max(64)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/)
    .message(
      'Must contain at least 6 Characters, One Uppercase, One Lowercase and One Number',
    );
};

export const userNameValidation = () => {
  return Joi.string().trim().min(1).max(60);
};

export const userFullNameValidation = () => {
  return Joi.string().trim().min(1).max(50);
};

export const folderNameValidation = () => {
  return Joi.string()
    .trim()
    .max(50)
    .regex(/^([^\\\/:*?"<>|&]+?)$/)
    .message(
      'The folder name cannot contain any of the following characters: /:*?"<>|&',
    );
};

export const entityNameValidation = () => {
  return Joi.string().trim().min(2).max(250);
};

export const contractInputsValidator = () => {
  return Joi.array().items(
    Joi.object({
      value: Joi.string().trim().max(255),
    }),
  );
};

export const templateTextValidator = {
  name: Joi.string().trim().max(255),
  htmlText: Joi.string().allow(''),
  plainText: Joi.string().allow(''),
};

export const contractNameValidator = {
  contractName: Joi.string()
    .trim()
    .max(100)
    .regex(/^([^\\\/:*?"<>|&]+?)$/)
    .message(
      'The folio name cannot contain any of the following characters: /:*?"<>|&',
    ),
  contractDocumentName: Joi.string()
    .regex(/^(.+?)\.([a-zA-Z]+)$/)
    .message('Invalid filename'),
};

export const templateInputsValidator = {
  htmlText: templateTextValidator.htmlText.trim(),
  plainText: templateTextValidator.plainText.trim(),
  variables: Joi.array()
    .unique((a, b) => a.id === b.id)
    .items(
      Joi.object({
        id: Joi.string().trim().max(255),
        label: Joi.string().trim().max(255),
      }),
    ),
};

export const workflowNameValidator = {
  workflowName: Joi.string()
    .trim()
    .max(100)
    .regex(/^([^\\\/:*?"<>|&]+?)$/)
    .message(
      'The workflow name cannot contain any of the following characters: /:*?"<>|&',
    ),
};

export const questionnaireNameValidator = {
  questionnaireName: Joi.string()
    .trim()
    .max(100)
    .regex(/^([^\\\/:*?"<>|&]+?)$/)
    .message(
      'The questionnaire name cannot contain any of the following characters: /:*?"<>|&',
    ),
};

export const dateGreaterThanNow = () => {
  return Joi.date()
    .greater('now')
    .less(new Date(new Date().setFullYear(new Date().getFullYear() + 30)))
    .messages({
      'date.less': `The date must fall within the next 30 years!`,
    });
};

export const dateGreaterOrEqualToday = () => {
  return Joi.date()
    .min(moment().startOf('day').toDate())
    .less(new Date(new Date().setFullYear(new Date().getFullYear() + 30)))
    .messages({
      'date.less': `The date must fall within the next 30 years!`,
    });
};

export const dateLessThanMax = () => {
  return Joi.date()
    .less(new Date(new Date().setFullYear(new Date().getFullYear() + 30)))
    .messages({
      'date.less': `The date must fall within the next 30 years!`,
    });
};

export const commentValidation = () => {
  return Joi.string().allow(null, '').max(500);
};
