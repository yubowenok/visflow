import request from 'supertest';
import app from '@src/app';

describe('GET /', () => {
  it('should return root HTML', (done) => {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect((res: Response) => {
        expect(res.text).toContain('VisFlow');
      })
      .expect(200, done);
  });
});
