import { Module, ActionContext } from 'vuex';
import { RootState } from '@/store';

import { axiosPost, errorMessage } from '@/common/util';
import { DatasetInfo } from '@/components/dataset-list/dataset-list';

interface CachedDataset {
  username: string;
  filename: string;
  data: string;
  fetchedAt: Date;
}

interface DatasetCache {
  [key: string]: CachedDataset;
}

interface DatasetState {
  cache: DatasetCache;
}

export interface GetDatasetOptions {
  username: string;
  filename: string;
}

const getDatasetFromCache = (cache: DatasetCache, key: string): CachedDataset | undefined => {
  return key in cache ? cache[key] : undefined;
};

const initialState: DatasetState = {
  cache: {},
};

const mutations = {
  cacheDataset(state: DatasetState, { key, data }: { key: string, data: string }) {
    const [username, filename] = key.split(',');
    state.cache[key] = {
      username,
      filename,
      data,
      fetchedAt: new Date(),
    };
  },
};

const actions = {
  getDataset(context: ActionContext<DatasetState, RootState>, options: GetDatasetOptions): Promise<string> {
    if (!options.username) {
      return Promise.reject('cannot fetch dataset without username');
    }
    const key = options.username + ',' + options.filename;
    const cached = getDatasetFromCache(context.state.cache, key);
    if (cached) {
      return new Promise(resolve => {
        resolve(cached.data);
      });
    }

    return new Promise((resolve, reject) => {
      axiosPost<string>('/dataset/get', options)
        .then(res => {
          context.commit('cacheDataset', {
            key,
            data: res.data,
          });
          resolve(res.data);
        })
        .catch(err => reject(errorMessage(err)));
    });
  },

  deleteDataset(context: ActionContext<DatasetState, RootState>, filename: string): Promise<void> {
    if (!context.rootState.user.username) {
      return Promise.reject('must login to delete dataset');
    }
    return new Promise((resolve, reject) => {
      axiosPost<void>('/dataset/delete', { filename })
        .then(() => resolve())
        .catch(err => reject(errorMessage(err)));
    });
  },

  listDataset(conntext: ActionContext<DatasetState, RootState>): Promise<DatasetInfo[]> {
    return new Promise((resolve, reject) => {
      axiosPost<DatasetInfo[]>('/dataset/list')
        .then(res => resolve(res.data))
        .catch(err => reject(errorMessage(err)));
    });
  },
};

const dataset: Module<DatasetState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
};

export default dataset;
