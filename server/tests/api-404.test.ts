import request from 'supertest';
import app, { appShutdown } from '@src/app';

describe('unmatched /api paths', () => {
  it('should 404 a secret probe rather than serve the client page', () => {
    return request(app)
      .get('/api/.env')
      .expect((res: request.Response) => {
        expect(res.text).not.toContain('VisFlow');
        // An anonymous probe must not create a session.
        expect(res.headers['set-cookie']).toBeUndefined();
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
      // The body tells the /api handler apart from Express's default "Cannot POST" 404.
      .expect(404, 'not found');
  });

  it('should still reach a real API route', () => {
    return request(app)
      .post('/api/user/whoami')
      .expect(200, { username: '', email: '' });
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

  it.each(['/.env', '/.git/config', '/config.json', '//api/.env'])(
    'should 404 the file probe %s rather than serve the client page',
    (probe: string) => {
      return request(app)
        .get(probe)
        .expect((res: request.Response) => {
          expect(res.text).not.toContain('VisFlow');
        })
        .expect(404);
    });
});

afterAll(() => appShutdown());
