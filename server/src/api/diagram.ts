import { Express, Response, Request } from 'express';

const diagramApi = (app: Express) => {
  app.post('/api/diagram/save/', (req: Request, res: Response) => {

  });

  app.get('/api/diagram/load/', (req: Request, res: Response) => {

  });
};

export default diagramApi;
