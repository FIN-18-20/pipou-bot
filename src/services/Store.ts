import { musicQueue } from './Music';

const Store = {
  musicQueues: new Map<string, musicQueue>(),
  inspiroBotQueues: new Map<string, boolean>()
};

export default Store;
