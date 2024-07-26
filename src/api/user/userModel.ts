import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { InferRawDocType, Model, Schema } from 'mongoose';
import { z } from 'zod';

import { Role } from '@/common/models/role';
import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

/**
 * User DTO (Data Transfer Object)
 * This is the shape of the data that will be sent or received from the API
 * Should not contain any sensitive information such as passwords, auditory fields, etc.
 *
 * It should be serializable, so it should not contain any functions, methods or any other non-serializable data
 *
 * Read more about DTO here: https://medium.com/@valksoft/uso-de-dto-vs-modelo-c1ae1d1797ea
 */
export const UserDTOSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  document: z.object({
    type: z.string(),
    number: z.string(),
  }),
});
export type UserDTO = z.infer<typeof UserDTOSchema>; // Inferred type of UserDTO

/**
 * User Model Schema Definition
 * This is the shape of the data that will be stored in the database
 * It must not contain any auditing fields such as createdAt, updatedAt, because Mongoose will add them automatically
 *
 * Read more about Mongoose Schemas here:
 * - https://mongoosejs.com/docs/typescript/schemas.html
 * - https://mongoosejs.com/docs/guide.html
 */
const userModelSchemaDefinition = {
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: Role },
  document: {
    type: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
  },
  forcePasswordReset: { type: Boolean, default: true },
};

// Type used to tell mongoose the shape of the schema available
type IUserSchemaDefinition = typeof userModelSchemaDefinition;
// Type used to add methods to the schema
interface IUserSchemaDefinitionMethods {
  toDto(): UserDTO;
}
type UserModelDefinition = Model<IUserSchemaDefinition, Record<string, never>, IUserSchemaDefinitionMethods>;

/**
 * User Model Schema
 * This is the Mongoose schema that will be used to create the User model
 * It contains the schema definition and some options
 *
 * For auditing fields, you can use the timestamps option to automatically add createdAt and updatedAt fields
 * Also, you can use the versionKey option to disable the __v field
 */
const userModelSchema = new Schema<IUserSchemaDefinition, UserModelDefinition, IUserSchemaDefinitionMethods>(
  userModelSchemaDefinition,
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Method to convert a User model to a UserDTO
 * This makes you able to convert a User model to a UserDTO easily
 *
 * Read more about Mongoose methods here: https://mongoosejs.com/docs/typescript/statics-and-methods.html
 */
userModelSchema.method('toDto', function (): UserDTO {
  return {
    id: this._id.toString(),
    firstName: this.firstName.toString(),
    lastName: this.lastName.toString(),
    role: this.role.toString() as Role,
    document: {
      type: this.document.type.toString(),
      number: this.document.number.toString(),
    },
    email: this.email.toString(),
  };
});

// Create a new Mongoose model for the User
export const UserModel = mongoose.model<IUserSchemaDefinition, UserModelDefinition>('Users', userModelSchema);

// Let's create a Typescript interface for the User model
export type User = InferRawDocType<typeof userModelSchemaDefinition> & IUserSchemaDefinitionMethods;
//export type User = typeof UserModel;

// ----------------------- INPUT VALIDATIONS -----------------------

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

// Input Validation for 'POST users/register' endpoint
export const UserCreationSchema = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    document: z.object({
      type: z.string(),
      number: z.string(),
    }),
  }),
});
export type UserCreationDTO = z.infer<typeof UserCreationSchema.shape.body>;
export type UserCreation = UserCreationDTO & { password: string; role: Role };

// Input Validation for POST /users/login
export const UserLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
export type UserLoginDTO = z.infer<typeof UserLoginSchema.shape.body>;

export const SessionTokenSchema = z.object({
  access_token: z.string(),
});
export type SessionToken = z.infer<typeof SessionTokenSchema>;
