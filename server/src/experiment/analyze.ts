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

const queries = JSON.parse(fs.readFileSync(def.QUERIES_FILE, 'utf8')) as def.ExperimentFlowsenseQuery[];
console.log(`${queries.filter(q => q.success).length}/${queries.length} queries`);
