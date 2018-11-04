export interface ExperimentState {
  filename: string;
  diagramName: string;
  step: string; // name of the experiment step the user is currently at
}

export interface ExperimentProgress {
  step: string; // name of the experiment step the user is currently at
}

export type ExperimentInfo = ExperimentState;

export const EXPERIMENT_STEPS = [
  'consentForm',
  'overview',
  'tutorial',
  'practice',
  'task',
  'end',
];
