import fs from 'fs';
import path from 'path';
import { musicQueue } from './Music';
import rrhQuotes from '../../data/rrh.json';

const directory = path.join(__dirname, '../../data/sounds');
const sounds = new Map<string, string>();
fs.readdirSync(directory).forEach((name) => {
  sounds.set(
    name.substring(0, name.lastIndexOf('.')),
    path.join(__dirname, '../../data/sounds', name),
  );
});

const Store = {
  musicQueues: new Map<string, musicQueue>(),
  inspiroBotQueues: new Map<string, boolean>(),
  rrhQuotes,
  sounds,
};

export default Store;
