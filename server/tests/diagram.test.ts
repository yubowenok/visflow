import request, { SuperTest, Test } from 'supertest';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import app from '@src/app';
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
const testDiagram = {
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
let filename: string;

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
        diagram: JSON.stringify(testDiagram),
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
            diagram: JSON.stringify(testDiagram),
            diagramName: 'myDiagram',
          })
          .expect((res: { body: string }) => {
            console.log(res.body);
            expect(res.body).toHaveLength(DEFAULT_HASH_LENGTH);
            filename = res.body;
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
    expect(fs.readdirSync(userDiagramDir).length).toBe(1);
    expect(fs.readFileSync(path.join(userDiagramDir, filename)).toString()).toBe(JSON.stringify(testDiagram));
  });

  it('should save the diagram and overwrite', done => {
    agent.post('/api/diagram/save')
      .send({
        diagram: JSON.stringify(testDiagram2),
        filename,
      })
      .expect(200, done);
  });

  it('the diagram file should be updated', () => {
    expect(fs.readFileSync(path.join(userDiagramDir, filename)).toString()).toBe(JSON.stringify(testDiagram2));
  });
});

afterAll(done => {
  if (fs.existsSync(diagramDir)) {
    fs.removeSync(diagramDir);
  }

  User.findOneAndRemove({ username: testUser.username }, () => {
    Diagram.find({ username: testUser.username }).remove(() => {
      done();
    });
  });
});
