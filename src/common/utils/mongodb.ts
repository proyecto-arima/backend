import mongoose from 'mongoose';

export const connectToMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    return Promise.resolve();
  } catch (ex) {
    return Promise.reject(ex);
  }
};
