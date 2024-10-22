import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { roleMiddleware } from '@/common/middleware/roleMiddleware';
import { SessionRequest } from '@/common/middleware/session';
import { ApiResponse, ResponseStatus } from '@/common/models/apiResponse';
import { Role } from '@/common/models/role';
import { handleApiResponse, validateRequest } from '@/common/utils/httpHandlers';

import { ImageCreationDTOSchema, ImageDTO } from './imagesModel';
import { imagesService } from './imagesService';
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const imagesRegistry = new OpenAPIRegistry();

imagesRegistry.register('ImageCreationDTO', ImageCreationDTOSchema);

export const imagesRouter: Router = (() => {
  const router = express.Router();

  router.post(
    '/',
    roleMiddleware([Role.TEACHER]),
    validateRequest(ImageCreationDTOSchema),
    async (req: SessionRequest, res: Response) => {
      if (!req.body) {
        return res.status(400).send('Request body is required');
      }

      const imageDTO: ImageDTO = req.body;
      const url = await imagesService.createImage(imageDTO);
      const apiResponse = new ApiResponse(
        ResponseStatus.Success,
        'Image successfully created',
        url,
        StatusCodes.CREATED
      );
      handleApiResponse(apiResponse, res);
    }
  );

  router.post('/url', upload.single('file'), async (req: SessionRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).send('File is required');
    }
    const url = await imagesService.getImageUrl(file);

    const apiResponse = new ApiResponse(ResponseStatus.Success, 'Url obtained successfully', url, StatusCodes.OK);
    handleApiResponse(apiResponse, res);
  });

  return router;
})();
