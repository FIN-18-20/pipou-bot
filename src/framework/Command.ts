import uuid from '@lukeed/uuid';
import { Message } from 'discord.js';
import { Logger } from 'pino';
import { Base, BaseConfig } from './Base';
import { Bot } from './Bot';
import { findTextChannelByName } from './helpers';

export type CommandHandler = (context: CommandContext) => Promise<void>;

export interface CommandConfig extends BaseConfig {
  alias?: Array<string>;
  channelName?: string;
  handle: CommandHandler;
}

export interface CommandContext {
  /**
   * discord.js Message
   */
  message: Message;
  /**
   * Pino logger.
   */
  logger: Logger;
}

export interface PublicCommand {
  name: string;
  description: string;
  alias?: Array<string>;
}

export class Command extends Base {
  private readonly delimiter = '!';
  private readonly _alias?: Array<string>;
  private readonly channelName?: string;
  private readonly handler: CommandHandler;
  private bot: Bot | undefined;

  public constructor(config: CommandConfig) {
    super(config);

    if (config.channelName) {
      this.channelName = config.channelName;
    }
    if (config.alias) {
      this._alias = config.alias;
    }

    this.handler = config.handle;
    this._messageHandler = this._messageHandler.bind(this);
  }

  async _messageHandler(message: Message): Promise<void> {
    message.content = message.content.trim();
    if (this.bot === undefined) return;
    if (!message.content.startsWith(this.delimiter) || message.author.bot) {
      return;
    }

    const commandName = message.content.slice(1).split(' ')[0].toLowerCase();
    if (commandName !== this.name && !this.alias?.includes(commandName)) {
      return;
    }

    const client = this.bot.client;
    if (
      this.channelName &&
      message.channel.id !== findTextChannelByName(client, this.channelName)?.id
    ) {
      return;
    }

    const logger = this.bot.logger.child({
      id: uuid(),
      type: 'Command',
      name: this.name,
    });

    try {
      await this.handler({ message, logger });
    } catch (error: any) {
      logger.fatal('Error in Command');
      logger.fatal(error);
    }
  }

  public get alias(): Array<string> | undefined {
    return this._alias;
  }

  public start(bot: Bot): void {
    this.bot = bot;
    this.bot.client.on('message', this._messageHandler);
  }

  public stop(bot: Bot): void {
    bot.client.off('message', this._messageHandler);
  }
}
