export interface DatasetState {
  cache: DatasetCache;
  lastList: DatasetInfo[];
}

export interface DatasetInfo {
  originalname: string;
  filename: string;
  size: number;
  lastUsedAt: string;
  createdAt: string;
}

export interface CachedDataset {
  username: string;
  filename: string;
  data: string;
  fetchedAt: Date;
}

export interface DatasetCache {
  [key: string]: CachedDataset;
}

export interface GetDatasetOptions {
  username: string;
  filename: string;
}
