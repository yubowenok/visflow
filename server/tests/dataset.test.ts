import request from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import app from '@src/app';
import User from '@src/models/user';
import { DATA_PATH } from '@src/config/env';

const testUser = {
  username: 'dataset_test_user',
  password: '123456',
  confirmPassword: '123456',
  email: 'dataset_test_user@visflow.org',
};
const datasetDir = path.join(DATA_PATH, '/dataset');

beforeAll(() => {
  const user = new User(testUser);
  user.save();
});

describe('POST /api/dataset/', () => {
  const agent = request.agent(app);

  it('DATA_PATH/dataset folder should not exist', () => {
    expect(fs.existsSync(datasetDir)).toBeFalsy();
  });

  it('should not upload dataset without login', (done) => {
    agent.post('/api/dataset/upload')
      .attach('dataset', './tests/dataset.test.csv')
      .expect(401, done);
  });

  it('should upload dataset with login', (done) => {
    agent.post('/api/user/login')
      .send(_.pick(testUser, ['username', 'password']))
      .end(err => {
        expect(err).toBeFalsy();

        agent.post('/api/dataset/upload')
          .attach('dataset', './tests/dataset.test.csv')
          .expect(200, done);
      });
  });

  it('dataset folder should exist', () => {
    expect(fs.existsSync(datasetDir)).toBeTruthy();
  });

  const userDatasetDir = path.join(datasetDir, testUser.username);
  it('dataset folder should contain a username folder', () => {
    expect(fs.existsSync(userDatasetDir)).toBeTruthy();
  });

  it('user\'s dataset folder should have one file', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(1);
  });

  it('should upload the same dataset again', (done) => {
    agent.post('/api/dataset/upload')
      .attach('dataset', './tests/dataset.test.csv')
      .expect(200, done);
  });

  it('user\'s dataset folder should have two files', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(2);
  });
});

afterAll((done) => {
  if (fs.existsSync(datasetDir)) {
    fs.removeSync(datasetDir);
  }

  User.findOneAndRemove({ username: testUser.username }, () => {
    done();
  });
});
