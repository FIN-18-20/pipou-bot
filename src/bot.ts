import path from 'path';

import 'make-promises-safe';
import * as Dotenv from 'dotenv';

import { Bot } from './framework';

Dotenv.config();

export const bot = new Bot({
  token: process.env.DISCORD_TOKEN,
  commands: path.join(__dirname, 'commands'),
  // crons: path.join(__dirname, 'crons'),
  // formatCheckers: path.join(__dirname, 'format-checkers'),
});

bot.start().then(() => {
  bot.logger.info('Bot started');
});
