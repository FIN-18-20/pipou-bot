import { Base, BaseConfig } from './Base';
import { Bot } from './Bot';
import { findTextChannelByName } from './helpers';
import { Message } from 'discord.js';
import uuid from '@lukeed/uuid';
import { Logger } from 'pino';

type FunctionChecker = (message: string, logger: Logger) => boolean;

export interface FormatCheckerConfig extends BaseConfig {
  channelName: string;
  checker: RegExp | FunctionChecker;
  examples?: string[];
}

export class FormatChecker extends Base {
  private readonly channelName: string;
  private readonly checker: RegExp | FunctionChecker;
  private readonly examples?: string[];

  private bot: Bot | undefined;

  public constructor(config: FormatCheckerConfig) {
    super(config);
    this.channelName = config.channelName;
    if (
      typeof config.checker === 'function' ||
      config.checker instanceof RegExp
    )
      this.checker = config.checker;
    else throw new Error(`invalid checker for ${this.name}`);

    this.examples = config.examples;

    this._messageHandler = this._messageHandler.bind(this);
  }

  async _messageHandler(message: Message): Promise<void> {
    console.log('hello lé amis');
    if (this.bot === undefined) return;
    const client = this.bot.client;
    if (
      message.channel.id !== findTextChannelByName(client, this.channelName)?.id
    )
      return;

    const logger = this.bot.logger.child({
      id: uuid(),
      type: 'FormatChecker',
      name: this.name,
    });

    if (this.checker instanceof RegExp) {
      if (this.checker.test(message.cleanContent) === true) return;
    } else if (this.checker instanceof Function) {
      if (this.checker(message.cleanContent, logger)) return;
    }

    logger.debug('bad format detected');

    const { cleanContent, author } = message;

    await message.delete();
    const warningContent = [
      'Bonjour,',
      `Le message que vous avez posté dans ${message.channel} est incorrectement formaté, il a donc été supprimé.`,
      'Pour rappel, voici le message que vous aviez envoyé :',
      `\`\`\`${cleanContent}\`\`\``,
      ...(this.examples !== undefined
        ? [
            `Voici ${this.examples.length > 1 ? 'des' : 'un'} example${
              this.examples.length > 1 ? 's' : ''
            } de message correctement formaté :`,
            ...this.examples.map((example) => `\`\`\`${example}\`\`\``),
          ]
        : []),
    ];

    try {
      await author
        .send(warningContent.join('\n'))
        .then((warning) => warning.suppressEmbeds(true));
    } catch (err) {
      logger.error(
        err,
        'failed to send private message to user %s',
        author.tag,
      );
      const channel = findTextChannelByName(client, 'logs');
      if (channel === undefined)
        return logger.fatal('text channel not found: logs');
      warningContent.unshift(`${author.toString()}:`);
      channel.send(warningContent.join('\n'));
    }
    logger.debug('warning message sent');
  }

  public start(bot: Bot): void {
    this.bot = bot;
    this.bot.client.on('message', this._messageHandler);
  }

  public stop(bot: Bot): void {
    bot.client.off('message', this._messageHandler);
  }
}
