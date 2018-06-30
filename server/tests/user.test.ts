import request from 'supertest';
import app from '@src/app';
import _ from 'lodash';
import logger from '@src/util/logger';

describe('POST /api/user/signup', () => {
  const signupData = {
    username: 'abc',
    password: '123456',
    confirmPassword: '123456',
    email: 'abc@test.com',
  };

  it('should signup successfully', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData))
      .expect({ username: 'abc' })
      .expect(200, done);
  });

  it('should not signup because username is too short', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { username: 'x' }))
      .expect(400, done);
  });

  it('should not signup because username has leading digit', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { username: '1xyz' }))
      .expect(400, done);
  });

  it('should not signup because password is too short', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { password: '123', confirmPassword: '123' }))
      .expect(400, done);
  });

  it('should not signup because passwords do not match', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { password: '123456', confirmPassword: '111111' }))
      .expect(400, done);
  });

  it('should not signup because email is invalid', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { email: 'xyz' }))
      .expect(400, done);
  });
});
