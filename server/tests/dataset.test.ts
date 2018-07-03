import request, { SuperTest, Test } from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import app from '@src/app';
import User from '@src/models/user';
import Dataset from '@src/models/dataset';
import { DATA_PATH } from '@src/config/env';

const testUser = {
  username: 'dataset_test_user',
  password: '123456',
  confirmPassword: '123456',
  email: 'dataset_test_user@visflow.org',
};
const datasetDir = path.join(DATA_PATH, '/dataset');
const userDatasetDir = path.join(datasetDir, testUser.username);

let agent: SuperTest<Test>;
let filename1: string;
let filename2: string;

beforeAll(() => {
  const user = new User(testUser);
  user.save();
  agent = request.agent(app);
});

describe('upload datasets', () => {
  it('DATA_PATH/dataset folder should not exist', () => {
    expect(fs.existsSync(datasetDir)).toBeFalsy();
  });

  it('should not upload dataset without login', done => {
    agent.post('/api/dataset/upload')
      .attach('dataset', './tests/dataset.test.csv')
      .expect(401, done);
  });

  it('should upload dataset with login', done => {
    agent.post('/api/user/login')
      .send(_.pick(testUser, ['username', 'password']))
      .end(err => {
        expect(err).toBeFalsy();

        agent.post('/api/dataset/upload')
          .attach('dataset', './tests/dataset.test.csv')
          .expect((res: { body: { filename: string, originalname: string } }) => {
            expect(res.body).toEqual(expect.objectContaining({ originalname: 'dataset.test.csv' }));
            expect(res.body).toHaveProperty('filename');
            filename1 = res.body.filename;
          })
          .expect(200, done);
      });
  });

  it('dataset folder should exist', () => {
    expect(fs.existsSync(datasetDir)).toBeTruthy();
  });

  it('dataset folder should contain a username folder', () => {
    expect(fs.existsSync(userDatasetDir)).toBeTruthy();
  });

  it('user\'s dataset folder should have one file', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(1);
  });

  it('should upload the same dataset again', done => {
    agent.post('/api/dataset/upload')
      .attach('dataset', './tests/dataset.test.csv')
      .expect((res: { body: { filename: string, originalname: string } }) => {
        expect(res.body).toEqual(expect.objectContaining({ originalname: 'dataset.test.csv' }));
        expect(res.body).toHaveProperty('filename');
        filename2 = res.body.filename;
      })
      .expect(200, done);
  });

  it('user\'s dataset folder should have two files', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(2);
  });
});

describe('list datasets', () => {
  it('should list two datasets', done => {
    agent.post('/api/dataset/list')
      .expect((res: Response) => {
        expect(res.body).toHaveLength(2);
        expect(res.body).toContainEqual(expect.objectContaining({
          filename: filename1,
          originalname: 'dataset.test.csv',
        }));
        expect(res.body).toContainEqual(expect.objectContaining({
          filename: filename2,
          originalname: 'dataset.test.csv',
        }));
      })
      .expect(200, done);
  });
});

describe('delete a dataset', () => {
  it('should delete one dataset', done => {
    agent.post('/api/dataset/delete')
      .send({ filename: filename2 })
      .expect(200, done);
  });

  it('user\'s dataset folder should have one file after deletion', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(1);
  });

  it('should not delete non-existing dataset', done => {
    agent.post('/api/dataset/delete')
      .send({ filename: filename2 })
      .expect(400, done);
  });
});

describe('list datasets after deletion', () => {
  it('should list two datasets', done => {
    agent.post('/api/dataset/list')
      .expect((res: Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body).toContainEqual(expect.objectContaining({
          filename: filename1,
          originalname: 'dataset.test.csv',
        }));
      })
      .expect(200, done);
  });
});

describe('get dataset', () => {
  it('should get a file', done => {
    agent.post('/api/dataset/get')
      .send({ filename: filename1 })
      .expect('content-type', 'application/octet-stream')
      .expect((res: Response) => {
        const fileContent = fs.readFileSync('./dataset.test.csv');
        expect(res.body.toString()).toEqual(fileContent);
      })
      .expect(200, done);
  });

  it('should not get non-existing file', done => {
    agent.post('/api/dataset/get')
      .send({ filename: filename2 })
      .expect(400, done);
  });
});

afterAll(done => {
  if (fs.existsSync(datasetDir)) {
    fs.removeSync(datasetDir);
  }

  User.findOneAndRemove({ username: testUser.username }, () => {
    Dataset.find({ username: testUser.username }).remove(() => {
      done();
    });
  });
});
