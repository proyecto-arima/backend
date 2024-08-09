//unificado
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import https from 'https';

import { config } from '../utils/config';

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

export const createPresignedUrlForPut = ({ bucket, key }: PresignedUrlParams): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return createPresignedUrl(command);
};

export const createPresignedUrlForGet = ({ bucket, key }: PresignedUrlParams): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return createPresignedUrl(command);
};

const put = (url: string, data: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'PUT', headers: { 'Content-Length': new Blob([data]).size } }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        resolve(responseBody);
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.write(data);
    req.end();
  });
};

export const mainPut = async (): Promise<void> => {
  const KEY = 'test-env/fsd-object.txt';

  try {
    const clientUrl = await createPresignedUrlForPut({
      bucket: bucket,
      key: KEY,
    });

    console.log('Calling PUT using presigned URL with client', clientUrl);
    await put(clientUrl, 'Hello World');

    console.log('\nDone. Check your S3.');
  } catch (err) {
    console.error(err);
  }
};

export const mainGet = async (): Promise<void> => {
  const KEY = 'test-env/romi-object.txt';

  try {
    const clientUrl = await createPresignedUrlForGet({
      bucket: bucket,
      key: KEY,
    });

    console.log('Presigned URL with client');
    console.log(clientUrl);
  } catch (err) {
    console.error(err);
  }
};
