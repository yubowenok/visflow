import { Module, ActionContext } from 'vuex';
import { RootState } from '@/store';

import { axiosPost, errorMessage } from '@/common/util';
import { DatasetInfo, DatasetState, DatasetCache, CachedDataset, GetDatasetOptions } from './types';


const getDatasetFromCache = (cache: DatasetCache, key: string): CachedDataset | undefined => {
  return key in cache ? cache[key] : undefined;
};

const initialState: DatasetState = {
  lastList: [],
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
    const username = options.username || '';
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

  listDataset(context: ActionContext<DatasetState, RootState>): Promise<DatasetInfo[]> {
    return new Promise((resolve, reject) => {
      axiosPost<DatasetInfo[]>('/dataset/list')
        .then(res => {
          context.state.lastList = res.data;
          resolve(res.data);
        })
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
