import request from 'supertest';
import app, { appShutdown } from '@src/app';

describe('GET /', () => {
  it('should return root HTML', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect((res: request.Response) => {
        expect(res.text).toContain('VisFlow');
      })
      .expect(200);
  });
});

afterAll(() => appShutdown());
