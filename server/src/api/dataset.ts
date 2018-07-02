import { Express, Response, Request } from 'express';
import multer from 'multer';
import { DATA_PATH } from '../config/env';
import path from 'path';
import { isAuthenticated } from '../config/passport';
import fs from 'fs-extra';

const datasetApi = (app: Express) => {
  app.post('/api/dataset/*', isAuthenticated);
  app.post('/api/dataset/upload/', multer({
    storage: multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: (err: Error | null, destination: string) => void) => {
        const dir = path.join(DATA_PATH, 'dataset/', req.user.username);
        if (!fs.existsSync(dir)) {
          fs.mkdirpSync(dir);
        }
        cb(null, dir);
      },
    }),
  }).single('dataset'), (req: Request, res: Response) => {
    return res.status(200).send(req.file.originalname);
  });

  app.get('/api/dataset/get/', (req: Request, res: Response) => {

  });

  app.get('/api/dataset/list/', (req: Request, res: Response) => {
  });
};

export default datasetApi;
