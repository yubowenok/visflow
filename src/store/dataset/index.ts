import { Module, ActionContext } from 'vuex';
import { RootState } from '../index';

import { axiosPost, errorMessage } from '@/common/util';

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

export interface FetchDatasetOptions {
  username: string;
  filename: string;
}

const fetchDatasetFromCache = (cache: DatasetCache, key: string): CachedDataset | undefined => {
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
  fetchDataset(context: ActionContext<DatasetState, RootState>, options: FetchDatasetOptions): Promise<string> {
    if (!options.username) {
      return Promise.reject('cannot fetch dataset without username');
    }
    const key = options.username + ',' + options.filename;
    const cached = fetchDatasetFromCache(context.state.cache, key);
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
};

export const dataset: Module<DatasetState, RootState> = {
  namespaced: true,
  state: initialState,
  mutations,
  actions,
};
