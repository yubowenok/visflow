export const ANSWERS_FILE = 'experiment_task_answers.json';
export const TIMES_FILE = 'experiment_task_times.json';
export const QUERIES_FILE = 'experiment_flowsense_queries.json';
export const QUERIES_REASONS_FILE = 'experiment_flowsense_queries_reasons.json';
export const TIME_DISTRIBUTION_FILE = 'experiment_task_times.csv';
export const REASONS_DISTRIBUTION_FILE = 'experiment_flowsense_reasons.csv';

export const EXPERIMENT_STEPS = [
  'consentForm',
  'overview',
  'visflowTutorial',
  'clear1',
  'flowsenseTutorial',
  'practice',
  'clear2',
  'task',
  'task1',
  'task2',
  'task3',
  'survey',
  'end',
];

export interface ExperimentAnswer {
  filename: string;
  answerList: string[];
}

export interface ExperimentTimes {
  filename: string;
  times: Array<{ step: string, time: number }>;
}

export interface ExperimentFlowsenseQuery {
  query: string;
  rawQuery: string;
  success: boolean;
  reason?: string; // manually marked reason for query failure
}
