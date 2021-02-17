import { musicQueue } from './Music';
import rrhQuotes from '../data/rrh.json';

const Store = {
  musicQueues: new Map<string, musicQueue>(),
  inspiroBotQueues: new Map<string, boolean>(),
  rrhQuotes,
};

export default Store;
