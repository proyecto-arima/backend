import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import mongoose, { Document, InferRawDocType, Model, Schema } from 'mongoose';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const TestDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  answers: z
    .array(
      z.array(z.number()).length(4) // Cada fila tiene 4 números
    )
    .length(12), // 12 filas en total
});
export type TestDTO = z.infer<typeof TestDTOSchema>;

const testModelSchemaDefinition: Record<keyof Omit<TestDTO, 'id'>, any> = {
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'Users' },
  answers: {
    type: [[Number]], // Matriz de 12x4
    required: true,
  },
};

type ITestSchemaDefinition = Omit<TestDTO, 'id'>;

interface ITestSchemaDefinitionMethods {
  toDto(): TestDTO;
}
type TestModelDefinition = Model<ITestSchemaDefinition & Document, Record<string, never>, ITestSchemaDefinitionMethods>;

const testModelSchema = new Schema<ITestSchemaDefinition, TestModelDefinition, ITestSchemaDefinitionMethods>(
  testModelSchemaDefinition,
  {
    timestamps: true,
    versionKey: false,
  }
);

testModelSchema.method('toDto', function (): TestDTO {
  return {
    id: this._id.toString(),
    userId: this.userId.toString(),
    answers: this.answers,
  };
});

// Create a new Mongoose model for the Test
export const TestModel = mongoose.model<ITestSchemaDefinition, TestModelDefinition>('Test', testModelSchema);

export type Test = InferRawDocType<typeof testModelSchemaDefinition> & ITestSchemaDefinitionMethods;

export const TestCreationSchema = z.object({
  body: z.object({
    answers: z
      .array(z.array(z.number()).length(4))
      .length(12)
      .refine(
        (answers) =>
          answers.every((row) => {
            const uniqueNumbers = new Set(row);
            const sum = row.reduce((acc, val) => acc + val, 0);
            return uniqueNumbers.size === 4 && sum === 10;
          }),
        {
          message: 'Cada fila debe tener 4 numeros unicos que sumen 10',
        }
      ),
  }),
});

export type TestCreationDTO = z.infer<typeof TestCreationSchema.shape.body>;
export type TestCreation = TestCreationDTO;
