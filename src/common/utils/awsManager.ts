import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';

import { config } from './config';

interface PresignedUrlParams {
  bucket: string;
  key: string;
}

const createS3Client = (): S3Client => {
  return new S3Client({
    region: config.cloud_service.aws.region,
    credentials: {
      accessKeyId: config.cloud_service.aws.aws_access_key_id,
      secretAccessKey: config.cloud_service.aws.aws_secret_access_key,
    },
  });
};

const bucket = config.cloud_service.aws.bucket;

const createPresignedUrl = (command: GetObjectCommand | PutObjectCommand): Promise<string> => {
  const client = createS3Client();
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

export const createPresignedUrlForGet = ({ bucket, key }: PresignedUrlParams): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return createPresignedUrl(command);
};

export const s3Put = async (key: string, file: Express.Multer.File): Promise<string> => {
  try {
    const client = createS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: `${config.cloud_service.aws.prefix}/${key}`,
      Body: fs.readFileSync(file.path),
    });

    await client.send(command);

    console.log('File uploaded successfully. Generating presigned URL for GET.');

    // Genera la URL pre-firmada para acceder al archivo
    const getUrl = await createPresignedUrlForGet({
      bucket: bucket,
      key: `${config.cloud_service.aws.prefix}/${key}`,
    });

    return getUrl;
  } catch (err) {
    console.error('Error uploading file or generating presigned URL:', err);
    return '';
  }
};

export const s3Get = async (key: string): Promise<string> => {
  try {
    const clientUrl = await createPresignedUrlForGet({
      bucket: bucket,
      key: `${config.cloud_service.aws.prefix}/${key}`,
    });

    console.log('Presigned URL with client');
    console.log(clientUrl);
    return clientUrl;
  } catch (err) {
    console.error(err);
    return '';
  }
};
