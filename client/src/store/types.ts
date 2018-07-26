
import { Store } from 'vuex';
import { DataflowState } from '@/store/dataflow/types';
import { InteractionState } from '@/store/interaction/types';
import { UserState } from '@/store/user/types';
import { HistoryState } from '@/store/history/types';

export interface RootState {
  version?: number;
  dataflow: DataflowState;
  interaction: InteractionState;
  user: UserState;
  history: HistoryState;
}

export type RootStore = Store<RootState>;
