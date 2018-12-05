export interface ExperimentState {
  filename: string;
  diagramName: string;
  step: string; // name of the experiment step the user is currently at
  maxStep: string; // the last step the experiment ever reached, keeps track of the latest progress
}

export interface ExperimentProgress {
  step: string; // name of the experiment step the user is currently at
}

export type ExperimentInfo = ExperimentState;

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
