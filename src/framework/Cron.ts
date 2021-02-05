import uuid from '@lukeed/uuid';
import { CronJob, CronTime } from 'cron';
import { Client } from 'discord.js';
import { Logger } from 'pino';
import { Base, BaseConfig } from './Base';
import { Bot } from './Bot';

export type CronHandler = (context: CronContext) => Promise<void>;

export interface CronConfig extends BaseConfig {
  /**
   * Cron schedule expression.
   * Use https://crontab.guru/ to build your expression.
   */
  schedule: string;
  /**
   * Cron handler. Will be called on schedule after the bot is started.
   */
  handle: CronHandler;
}

export interface CronContext {
  /**
   * Date of the cron execution. Based on the schedule to avoid runtime inaccuracy.
   */
  date: Date;
  /**
   * discord.js Client instance.
   */
  client: Client;
  /**
   * Pino logger.
   */
  logger: Logger;
}

export class Cron extends Base {
  private readonly schedule: string;
  private readonly handler: CronHandler;
  private cronJob: CronJob | null;

  public constructor(config: CronConfig) {
    super(config);
    try {
      new CronTime(config.schedule);
    } catch (error) {
      throw new Error(`Invalid Cron schedule format: "${config.schedule}"`);
    }
    this.schedule = config.schedule;
    this.handler = config.handle;
    this.cronJob = null;
  }

  private async executeJob(date: Date, bot: Bot) {
    const logger = bot.logger.child({
      id: uuid(),
      type: 'Cron',
      name: this.name,
    });
    try {
      logger.debug('execute cron handler');
      await this.handler({ date, client: bot.client, logger });
    } catch (error) {
      logger.error(error, 'cron handler error');
    }
  }

  public start(bot: Bot): void {
    const cronJob = new CronJob({
      cronTime: this.schedule,
      onTick: () => {
        const date = cronJob.lastDate();
        this.executeJob(date, bot);
      },
    });

    this.cronJob = cronJob;
    cronJob.start();
  }

  public stop(): void {
    this.cronJob?.stop();
  }
}
