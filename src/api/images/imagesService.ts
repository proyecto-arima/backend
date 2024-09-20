import AWS from 'aws-sdk';
import OpenAI from 'openai';

import { config } from '@/common/utils/config';

import { ImageDTO } from './imagesModel';

// TODO: Use previous aws client!!!
const s3 = new AWS.S3({
  accessKeyId: config.cloud_service.aws.aws_access_key_id,
  secretAccessKey: config.cloud_service.aws.aws_secret_access_key,
  region: config.cloud_service.aws.region,
});

const bucketName = config.cloud_service.aws.imagesBucket;
const openai = new OpenAI({
  organization: config.openai.organization,
  apiKey: config.openai.apiKey,
});

export const imagesService = {
  async generateImage(prompt: string): Promise<Buffer> {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1, // Genera 1 imagen
        size: '1024x1024',
      });

      const imageUrl = response.data[0].url; // Obtener la URL de la imagen generada

      if (!imageUrl) {
        throw new Error('No image URL returned');
      }

      // Descargar la imagen
      const imageResponse = await fetch(imageUrl, { method: 'GET' });
      if (!imageResponse.ok) {
        throw new Error(`Error fetching image: ${imageResponse.statusText}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      throw new Error(`Error generating image: ${error}`);
    }
  },

  // Función para subir la imagen a S3
  async uploadToS3(imageBuffer: Buffer, key: string): Promise<string> {
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png', // Ajustar si el formato de imagen es diferente
    };

    try {
      const data = await s3.upload(uploadParams).promise();
      return data.Location; // Retorna la URL de la imagen en S3
    } catch (error) {
      throw new Error(`Error uploading to S3: ${error}`);
    }
  },

  createImage: async (image: ImageDTO): Promise<string> => {
    const prompt = `Imagen artística que permita identificar a un curso escolar cuyo nombre es ${image.name} y su descripción es ${image.description}`;

    const imageBuffer = await imagesService.generateImage(prompt);
    const imageUrl = await imagesService.uploadToS3(imageBuffer, crypto.randomUUID());

    return imageUrl;
  },
};
