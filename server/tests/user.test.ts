import request from 'supertest';
import app, { appShutdown } from '@src/app';
import User from '@src/models/user';
import _ from 'lodash';

describe('POST /api/user/signup', () => {
  const signupData = {
    username: 'abc',
    password: '123456',
    confirmPassword: '123456',
    email: 'abc@visflow.org',
  };

  it('should signup successfully', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData))
      .expect({
        username: signupData.username,
        email: signupData.email,
      })
      .expect(200, done);
  });

  it('should not signup because of duplicate username', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { email: 'other@visflow.org' }))
      .expect(400, done);
  });

  it('should not signup because of duplicate email', (done) => {
    request(app)
      .post('/api/user/signup')
      .send(_.extend({}, signupData, { username: 'xyz' }))
      .expect(400);

    // remove the signed-up user
    User.findOneAndRemove({ username: 'abc' }, err => {
      if (err) {
        throw err;
      }
      done();
    });
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

afterAll(appShutdown);
