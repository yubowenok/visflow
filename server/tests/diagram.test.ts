import request from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import app, { appShutdown } from '@src/app';
import User from '@src/models/user';
import Diagram from '@src/models/diagram';
import Log from '@src/models/log';
import { DATA_PATH } from '@src/config/env';
import { DEFAULT_HASH_LENGTH } from '@src/common/util';

const testUser = {
  username: 'diagram_test_user',
  password: '123456',
  confirmPassword: '123456',
  email: 'diagram_test_user@visflow.org',
};

// Diagram content does not matter.
const testDiagram1 = {
  nodes: ['abc'],
  edges: [123],
};
const testDiagram2 = {
  nodes: ['efg'],
  edges: [456],
};

const diagramDir = path.join(DATA_PATH, '/diagram');
const userDiagramDir = path.join(diagramDir, testUser.username);

let agent: ReturnType<typeof request.agent>;
let filename1: string;
let filename2: string;

const login = () => agent.post('/api/user/login').send(_.pick(testUser, ['username', 'password']));
const logout = () => agent.post('/api/user/logout');

beforeAll(async () => {
  await User.deleteMany({ username: testUser.username });
  await new User(testUser).save();
  agent = request.agent(app);
});

describe('save diagram', () => {
  it('DATA_PATH/diagram folder should not exist', () => {
    expect(fs.existsSync(diagramDir)).toBeFalsy();
  });

  it('should not save diagram without login', () => {
    return agent.post('/api/diagram/save-as')
      .send({
        diagram: JSON.stringify(testDiagram1),
        diagramName: 'myDiagram',
      })
      .expect(401);
  });

  it('should save diagram with login', async () => {
    await login().expect(200);
    await agent.post('/api/diagram/save-as')
      .send({
        diagram: JSON.stringify(testDiagram1),
        diagramName: 'myDiagram',
      })
      .expect((res: request.Response) => {
        expect(res.body).toHaveLength(DEFAULT_HASH_LENGTH);
        filename1 = res.body;
      })
      .expect(200);
  });

  it('diagram folder should exist', () => {
    expect(fs.existsSync(diagramDir)).toBeTruthy();
  });

  it('diagram folder should contain a username folder', () => {
    expect(fs.existsSync(userDiagramDir)).toBeTruthy();
  });

  it('user\'s diagram folder should have one file that contains the JSON string of the diagram', () => {
    const files = fs.readdirSync(userDiagramDir);
    expect(files.length).toBe(1);
    expect(fs.readFileSync(path.join(userDiagramDir, filename1)).toString()).toBe(JSON.stringify(testDiagram1));
  });

  it('should save the diagram and overwrite', () => {
    return agent.post('/api/diagram/save')
      .send({
        diagram: JSON.stringify(testDiagram2),
        filename: filename1,
      })
      .expect(200);
  });

  it('the diagram file should be updated', () => {
    expect(fs.readFileSync(path.join(userDiagramDir, filename1)).toString()).toBe(JSON.stringify(testDiagram2));
  });

  it('should save with a duplicate diagramName', () => {
    return agent.post('/api/diagram/save-as')
      .send({
        diagram: JSON.stringify(testDiagram2),
        diagramName: 'myDiagram', // the same diagram name
        prevFilename: filename1,
      })
      .expect((res: request.Response) => {
        expect(res.body).toHaveLength(DEFAULT_HASH_LENGTH);
        filename2 = res.body;
      })
      .expect(200);
  });

  it('user\'s diagram folder should have two files', () => {
    const files = fs.readdirSync(userDiagramDir);
    expect(files.length).toBe(2);
    expect(files.sort()).toEqual([filename1, filename2].sort());
    expect(fs.readFileSync(path.join(userDiagramDir, filename1)).toString()).toBe(JSON.stringify(testDiagram2));
    expect(fs.readFileSync(path.join(userDiagramDir, filename2)).toString()).toBe(JSON.stringify(testDiagram2));
  });
});

describe('list diagrams', () => {
  it('should list two diagrams', () => {
    return agent.post('/api/diagram/list')
      .expect((res: request.Response) => {
        expect(res.body).toHaveLength(2);
        expect(res.body).toContainEqual(expect.objectContaining({
          diagramName: 'myDiagram',
          filename: filename1,
        }));
        expect(res.body).toContainEqual(expect.objectContaining({
          diagramName: 'myDiagram',
          filename: filename2,
        }));
      })
      .expect(200);
  });
});

describe('diagram logs', () => {
  it('should append logs to a diagram', async () => {
    await agent.post('/api/log/save').send({ filename: filename1, logs: [{ type: 'a' }] }).expect(200);
    await agent.post('/api/log/save').send({ filename: filename1, logs: [{ type: 'b' }] }).expect(200);
    const log = await Log.findOne({ username: testUser.username, filename: filename1 });
    expect(log.logs).toHaveLength(2);
  });

  it('should copy logs on save-as from prevFilename', async () => {
    await agent.post('/api/log/save').send({ filename: filename2, logs: [{ type: 'c' }] }).expect(200);
    const res = await agent.post('/api/diagram/save-as')
      .send({ diagram: '{}', diagramName: 'copy', prevFilename: filename1 })
      .expect(200);
    const log = await Log.findOne({ username: testUser.username, filename: res.body });
    expect(log.logs.map((entry: { type: string }) => entry.type)).toEqual(['a', 'b']);
    await agent.post('/api/diagram/delete').send({ filename: res.body }).expect(200);
  });

  it('should not load logs as a non-admin', () => {
    return agent.post('/api/log/load').send({ filename: filename1 }).expect(401);
  });
});

describe('delete a diagram', () => {
  it('should delete one diagram', () => {
    return agent.post('/api/diagram/delete')
      .send({ filename: filename2 })
      .expect(200);
  });

  it('user\'s diagram folder should have one file after deletion', () => {
    expect(fs.readdirSync(userDiagramDir).length).toBe(1);
  });

  it('should not delete non-existing diagram', () => {
    return agent.post('/api/diagram/delete')
      .send({ filename: filename2 })
      .expect(400);
  });

  it('should not delete without login', async () => {
    await logout().expect(200);
    await agent.post('/api/diagram/delete')
      .send({ filename: filename1 })
      .expect(401);
  });

  afterAll(() => login().expect(200));
});

describe('list diagram after deletion', () => {
  it('should list one diagram', () => {
    return agent.post('/api/diagram/list')
      .expect((res: request.Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body).toContainEqual(expect.objectContaining({
          diagramName: 'myDiagram',
          filename: filename1,
        }));
      })
      .expect(200);
  });
});

describe('load diagram', () => {
  it('should load diagram', () => {
    return agent.post('/api/diagram/load')
      .send({ filename: filename1 })
      .expect('content-type', 'application/octet-stream')
      .expect((res: request.Response) => {
        expect(res.body.toString()).toBe(JSON.stringify(testDiagram2));
      })
      .expect(200);
  });

  it('should not load a non-existing diagram', () => {
    return agent.post('/api/diagram/load')
      .send({ filename: '0'.repeat(DEFAULT_HASH_LENGTH) })
      .expect(400);
  });
});

afterAll(async () => {
  if (fs.existsSync(diagramDir)) {
    fs.removeSync(diagramDir);
  }
  await User.findOneAndDelete({ username: testUser.username });
  await Diagram.deleteMany({ username: testUser.username });
  await Log.deleteMany({ username: testUser.username });
  await appShutdown();
});
