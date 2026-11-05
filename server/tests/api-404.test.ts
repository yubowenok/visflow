import request from 'supertest';
import app, { appShutdown } from '@src/app';

describe('unmatched /api paths', () => {
  it('should 404 a secret probe rather than serve the client page', () => {
    return request(app)
      .get('/api/.env')
      .expect((res: request.Response) => {
        expect(res.text).not.toContain('VisFlow');
      })
      .expect(404);
  });

  it('should 404 an unmatched GET under /api', () => {
    return request(app)
      .get('/api/v1/config.json')
      .expect(404);
  });

  it('should 404 an unmatched POST under /api', () => {
    return request(app)
      .post('/api/does-not-exist')
      .expect(404);
  });

  it('should still reach a real API route', () => {
    // Whatever this answers (401 without a session), it must not be the catch-all 404.
    return request(app)
      .post('/api/user/whoami')
      .expect((res: request.Response) => {
        expect(res.status).not.toBe(404);
      });
  });
});

describe('non-API paths', () => {
  it('should still serve the client page', () => {
    return request(app)
      .get('/some/client/route')
      .expect('Content-Type', /html/)
      .expect((res: request.Response) => {
        expect(res.text).toContain('VisFlow');
      })
      .expect(200);
  });
});

afterAll(() => appShutdown());
