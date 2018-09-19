
import { Store } from 'vuex';
import { DataflowState } from '@/store/dataflow/types';
import { DatasetState } from '@/store/dataset/types';
import { InteractionState } from '@/store/interaction/types';
import { UserState } from '@/store/user/types';
import { HistoryState } from '@/store/history/types';
import { FlowsenseState } from '@/store/flowsense/types';

export interface RootState {
  dataflow: DataflowState;
  interaction: InteractionState;
  user: UserState;
  history: HistoryState;
  flowsense: FlowsenseState;
  dataset: DatasetState;
}

export type RootStore = Store<RootState>;
