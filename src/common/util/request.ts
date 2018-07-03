import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import _ from 'lodash';

import { API_URL } from '../url';

/** Joins base url with relative url. */
export const urlJoin = (baseUrl: string, relativeUrl: string): string => {
  return relativeUrl ? baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '') : baseUrl;
};

export const axiosPost = <T>(url: string, data?: object, config?: AxiosRequestConfig): AxiosPromise<T> => {
  return axios.post(urlJoin(API_URL, url), data, _.extend({ withCredentials: true }, config));
};
