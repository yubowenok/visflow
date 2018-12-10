import _ from 'lodash';
import fs from 'fs';

import * as def from './def';

const times = JSON.parse(fs.readFileSync(def.TIMES_FILE, 'utf8')) as def.ExperimentTimes[];

const STEPS = ['visflowTutorial', 'flowsenseTutorial', 'task1', 'task2', 'task3'];
let timeDistributionCsv = 'filename,' + STEPS.join(',') + '\n';
times.forEach(timeRecord => {
  const timeValues = STEPS.map(step => {
    const record = timeRecord.times.filter(stepTime => stepTime.step === step)[0];
    return record.time || 0;
  });
  timeDistributionCsv += timeRecord.filename + ',' + timeValues.join(',') + '\n';
});
fs.writeFileSync(def.TIME_DISTRIBUTION_FILE, timeDistributionCsv, 'utf8');

let queries = JSON.parse(fs.readFileSync(def.QUERIES_FILE, 'utf8')) as def.ExperimentFlowsenseQuery[];
console.log(`${queries.filter(q => q.success).length}/${queries.length} queries`);

queries = JSON.parse(fs.readFileSync(def.QUERIES_REASONS_FILE, 'utf8')) as def.ExperimentFlowsenseQuery[];

const countReason: { [reason: string]: number } = {};
queries.forEach(query => {
  if (!query.success) {
    if (query.reason === undefined) {
      console.warn('missing reason', query);
      return;
    }
    if (!(query.reason in countReason)) {
      countReason[query.reason] = 0;
    }
    countReason[query.reason]++;
  }
});
let reasonCsv = 'type,reason\n';
_.each(countReason, (count, reason) => {
  reasonCsv += reason + ',' + count + '\n';
});
fs.writeFileSync(def.REASONS_DISTRIBUTION_FILE, reasonCsv, 'utf8');
console.log(countReason);
const countSuccess = queries.filter(q => q.success).length;
console.log(`${countSuccess}/${queries.length} queries`, `${countSuccess / queries.length}`);
