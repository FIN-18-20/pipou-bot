import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';
import { musicQueue } from './Music';
import rrhQuotes from '../../data/rrh.json';

const directory = path.resolve(process.cwd(), 'data/sounds');
const sounds = new Map<string, string>();
fs.readdirSync(directory).forEach((name) => {
  sounds.set(
    name.substring(0, name.lastIndexOf('.')),
    path.resolve(process.cwd(), 'data/sounds', name),
  );
});

const Store = {
  musicQueues: new Map<string, musicQueue>(),
  inspiroBotQueues: new Map<string, boolean>(),
  rrhQuotes,
  sounds,
  soundNames: new Fuse(Array.from(sounds.keys()), { includeScore: true }),
};

export default Store;
