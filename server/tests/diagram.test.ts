import request, { SuperTest, Test } from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import mongoose from 'mongoose';

import app, { appShutdown } from '@src/app';
import User from '@src/models/user';
import Diagram from '@src/models/diagram';
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

let agent: SuperTest<Test>;
let filename1: string;
let filename2: string;

const login = (next: () => void) => {
  agent.post('/api/user/login')
    .send(_.pick(testUser, ['username', 'password']))
    .end(err => {
      if (err) {
        throw err;
      }
      next();
    });
};

const logout = (next: () => void) => {
  agent.post('/api/user/logout')
    .end(err => {
      if (err) {
        throw err;
      }
      next();
    });
};

beforeAll(() => {
  const user = new User(testUser);
  user.save();
  agent = request.agent(app);
});

describe('save diagram', () => {
  it('DATA_PATH/diagram folder should not exist', () => {
    expect(fs.existsSync(diagramDir)).toBeFalsy();
  });

  it('should not save diagram without login', done => {
    agent.post('/api/diagram/save-as')
      .send({
        diagram: JSON.stringify(testDiagram1),
        diagramName: 'myDiagram',
      })
      .expect(401, done);
  });

  it('should save diagram with login', done => {
    agent.post('/api/user/login')
      .send(_.pick(testUser, ['username', 'password']))
      .end(err => {
        expect(err).toBeFalsy();

        agent.post('/api/diagram/save-as')
          .send({
            diagram: JSON.stringify(testDiagram1),
            diagramName: 'myDiagram',
          })
          .expect((res: { body: string }) => {
            expect(res.body).toHaveLength(DEFAULT_HASH_LENGTH);
            filename1 = res.body;
          })
          .expect(200, done);
      });
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

  it('should save the diagram and overwrite', done => {
    agent.post('/api/diagram/save')
      .send({
        diagram: JSON.stringify(testDiagram2),
        filename: filename1,
      })
      .expect(200, done);
  });

  it('the diagram file should be updated', () => {
    expect(fs.readFileSync(path.join(userDiagramDir, filename1)).toString()).toBe(JSON.stringify(testDiagram2));
  });

  it('should save with a duplicate diagramName', done => {
    agent.post('/api/diagram/save-as')
      .send({
        diagram: JSON.stringify(testDiagram2),
        diagramName: 'myDiagram', // the same diagram name
      })
      .expect((res: { body: string }) => {
        expect(res.body).toHaveLength(DEFAULT_HASH_LENGTH);
        filename2 = res.body;
      })
      .expect(200, done);
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
  it('should list two diagrams', done => {
    agent.post('/api/diagram/list')
      .expect((res: Response) => {
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
      .expect(200, done);
  });
});

describe('delete a diagram', () => {
  it('should delete one diagram', done => {
    agent.post('/api/diagram/delete')
      .send({ filename: filename2 })
      .expect(200, done);
  });

  it('user\'s diagram folder should have one file after deletion', () => {
    expect(fs.readdirSync(userDiagramDir).length).toBe(1);
  });

  it('should not delete non-existing diagram', done => {
    agent.post('/api/diagram/delete')
      .send({ filename: filename2 })
      .expect(400, done);
  });

  it('should not delete without login', done => {
    logout(() => {
      agent.post('/api/diagram/delete')
        .send({ filename: filename1 })
        .expect(401, done);
    });
  });

  afterAll(done => login(done));
});

describe('list diagram after deletion', () => {
  it('should list one diagram', done => {
    agent.post('/api/diagram/list')
      .expect((res: Response) => {
        expect(res.body).toHaveLength(1);
        expect(res.body).toContainEqual(expect.objectContaining({
          diagramName: 'myDiagram',
          filename: filename1,
        }));
      })
      .expect(200, done);
  });
});

describe('load diagram', () => {
  it('should load diagram', done => {
    agent.post('/api/diagram/load')
      .send({ filename: filename1 })
      .expect('content-type', 'application/octet-stream')
      .expect((res: Response) => {
        const json = JSON.stringify(testDiagram2);
        expect(res.body.toString()).toBe(json);
      })
      .expect(200, done);
  });
});

afterAll(done => {
  if (fs.existsSync(diagramDir)) {
    fs.removeSync(diagramDir);
  }

  User.findOneAndRemove({ username: testUser.username }, err => {
    if (err) {
      throw err;
    }
    Diagram.find({ username: testUser.username }).remove(err2 => {
      if (err2) {
        throw err2;
      }
      appShutdown();
      done();
    });
  });
});
