import request from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import app, { appShutdown } from '@src/app';
import User from '@src/models/user';
import Dataset from '@src/models/dataset';
import { DATA_PATH } from '@src/config/env';

const testUser = {
  username: 'dataset_test_user',
  password: '123456',
  confirmPassword: '123456',
  email: 'dataset_test_user@visflow.org',
};
const testCsv = './tests/dataset.test.csv';
const datasetDir = path.join(DATA_PATH, '/dataset');
const userDatasetDir = path.join(datasetDir, testUser.username);

let agent: ReturnType<typeof request.agent>;
let filename1: string;
let filename2: string;

beforeAll(async () => {
  await User.deleteMany({ username: testUser.username });
  await new User(testUser).save();
  agent = request.agent(app);
});

describe('upload datasets', () => {
  it('DATA_PATH/dataset folder should not exist', () => {
    expect(fs.existsSync(datasetDir)).toBeFalsy();
  });

  it('should not upload dataset without login', () => {
    return agent.post('/api/dataset/upload')
      .attach('dataset', testCsv)
      .expect(401);
  });

  it('should upload dataset with login', async () => {
    await agent.post('/api/user/login')
      .send(_.pick(testUser, ['username', 'password']))
      .expect(200);
    await agent.post('/api/dataset/upload')
      .attach('dataset', testCsv)
      .expect((res: request.Response) => {
        expect(res.body).toEqual(expect.objectContaining({ originalname: 'dataset.test.csv' }));
        expect(res.body).toHaveProperty('filename');
        filename1 = res.body.filename;
      })
      .expect(200);
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

  it('should upload the same dataset again', () => {
    return agent.post('/api/dataset/upload')
      .attach('dataset', testCsv)
      .expect((res: request.Response) => {
        expect(res.body).toEqual(expect.objectContaining({ originalname: 'dataset.test.csv' }));
        expect(res.body).toHaveProperty('filename');
        filename2 = res.body.filename;
      })
      .expect(200);
  });

  it('user\'s dataset folder should have two files', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(2);
  });
});

describe('list datasets', () => {
  it('should list two datasets', () => {
    return agent.post('/api/dataset/list')
      .expect((res: request.Response) => {
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
      .expect(200);
  });
});

describe('delete a dataset', () => {
  it('should delete one dataset', () => {
    return agent.post('/api/dataset/delete')
      .send({ filename: filename2 })
      .expect(200);
  });

  it('user\'s dataset folder should have one file after deletion', () => {
    expect(fs.readdirSync(userDatasetDir).length).toBe(1);
  });

  it('should not delete non-existing dataset', () => {
    return agent.post('/api/dataset/delete')
      .send({ filename: filename2 })
      .expect(400);
  });
});

describe('list dataset after deletion', () => {
  it('should list one dataset', () => {
    return agent.post('/api/dataset/list')
      .expect((res: request.Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body).toContainEqual(expect.objectContaining({
          filename: filename1,
          originalname: 'dataset.test.csv',
        }));
      })
      .expect(200);
  });
});

describe('get dataset', () => {
  it('should get a file', () => {
    return agent.post('/api/dataset/get')
      .send({ filename: filename1 })
      .expect('content-type', 'application/octet-stream')
      .expect((res: request.Response) => {
        expect(res.body.toString()).toEqual(fs.readFileSync(testCsv).toString());
      })
      .expect(200);
  });

  it('should not get non-existing file', () => {
    return agent.post('/api/dataset/get')
      .send({ filename: filename2 })
      .expect(400);
  });
});

afterAll(async () => {
  if (fs.existsSync(datasetDir)) {
    fs.removeSync(datasetDir);
  }
  await User.findOneAndDelete({ username: testUser.username });
  await Dataset.deleteMany({ username: testUser.username });
  await appShutdown();
});
