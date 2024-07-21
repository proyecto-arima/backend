import mongoose from 'mongoose';
import { z } from 'zod';

import { ObjectId } from './commonTypes';

export const commonValidations = {
  id: z.custom<ObjectId>((v: string): ObjectId => new mongoose.Types.ObjectId(v)),
  // ... other common validations
};
