import { musicQueue } from './Music';

const Store = {
  queue: new Map<string, musicQueue>(),
  inspiroBotQueue: new Map<string, boolean>()
};

export default Store;
