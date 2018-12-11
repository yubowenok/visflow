import _ from 'lodash';
import fs from 'fs';
import { connectMongo } from '../mongo';
import Experiment from '../models/experiment';
import Log from '../models/log';
import { FlowsenseQuery } from '../models/flowsense';
import * as def from './def';

connectMongo();

const experimentAnswers: def.ExperimentAnswer[] = [];
const experimentTimes: def.ExperimentTimes[] = [];
const experimentFlowsenseQueries: def.ExperimentFlowsenseQuery[] = [];

Experiment.find({}, (err, experiments) => {
  if (err || !experiments.length) {
    return;
  }
  experiments.forEach(experiment => {
    if (!experiment.answers || !experiment.answers.task1.length) {
      // incomplete experiment
      return;
    }
    const { filename, answers } = experiment;
    const answerList: string[] = [];
    _.each(answers, (answerStrings, task) => {
      if (answerStrings.length > 1) {
        console.log(answerStrings);
        console.warn(`multiple answers found in "${filename}/${task}":\n` +
          `${answerStrings.map((ans, index) => `[${index}] ${ans}\n`).join('')}`);
      }
      const list = answerStrings.concat();
      list.sort((a, b) => b.length - a.length);
      answerList.push(list[0]);
    });
    experimentAnswers.push({
      filename,
      answerList,
    });
    fs.writeFileSync(def.ANSWERS_FILE, JSON.stringify(experimentAnswers, undefined, 2), 'utf8');
  });
});

Log.find({}, (err, logEntries) => {
  if (err || !logEntries) {
    return;
  }
  logEntries.forEach(logEntry => {
    const logs = logEntry.logs;
    const stepTimes: number[] = new Array(def.EXPERIMENT_STEPS.length).fill(0);
    let stepIndex = 0;
    let lastTimestamp = 0;

    let attempted = false;
    logs.forEach(log => {
      if (log.type === 'experiment-step') {
        const step = log.data.step;
        if (step.match(/task/)) {
          attempted = true;
        }
      }
    });
    if (!attempted) {
      // Skip undone experiments.
      return;
    }

    logs.forEach(log => {
      if (['commit', 'save-diagram', 'undo', 'redo', 'clear-diagram'].indexOf(log.type) !== -1) {
        return;
      }
      if (log.type === 'experiment-step') {
        const step = log.data.step;
        stepIndex = def.EXPERIMENT_STEPS.indexOf(step);
        if (step === 'overview') {
          lastTimestamp = log.timestamp;
        } else { // the step has advanced, increase the stepTimes
          // Count the time towards the step ahead of this, because when a person clicks next, the time was spent
          // on the step before the newly reached step.
          stepTimes[stepIndex - 1] += log.timestamp - lastTimestamp;
          lastTimestamp = log.timestamp;
        }
      } else if (log.type === 'load-diagram') {
        // The user refreshes the session. "lastTimestamp" is updated so that we don't count the time the user is out.
        lastTimestamp = log.timestamp;
      }
    });
    const record = {
      filename: logEntry.filename,
      times: def.EXPERIMENT_STEPS.map((step, index) => ({ step, time: stepTimes[index] })),
    };
    experimentTimes.push(record);
    fs.writeFileSync(def.TIMES_FILE, JSON.stringify(experimentTimes, undefined, 2), 'utf8');
  });
});

FlowsenseQuery.find({}, (err, queryEntries) => {
  if (err || !queryEntries) {
    return;
  }
  queryEntries.forEach(queryEntry => {
    const { query, rawQuery } = queryEntry;
    if (!queryEntry.result) {
      return;
    }
    const success = (queryEntry.result as { success: boolean }).success;
    if (success === undefined) {
      return;
    }
    experimentFlowsenseQueries.push({ query, rawQuery, success });
    fs.writeFileSync(def.QUERIES_FILE, JSON.stringify(experimentFlowsenseQueries, undefined, 2), 'utf8');
  });
});
