import mongoose from 'mongoose';

export const connectToMongoDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    return Promise.resolve();
  } catch (ex) {
    return Promise.reject(ex);
  }
};

export const disconnectFromMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    return Promise.resolve();
  } catch (ex) {
    return Promise.reject(ex);
  }
};
