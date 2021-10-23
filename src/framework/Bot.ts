import { once } from 'events';
import fs from 'fs';
import path from 'path';

import { Client } from 'discord.js';
import pino from 'pino';

import { Command, PublicCommand } from './Command';
import { Cron } from './Cron';
import { Base, BaseConfig } from './Base';
import { FormatChecker } from './FormatChecker';

export interface BotOptions {
  /**
   * Discord token.
   * Defaults to `process.env.DISCORD_TOKEN`.
   */
  token?: string;
  /**
   * Directory that contains the `Cron` definitions.
   */
  commands?: string;
  /**
   * Directory that contains the `Cron` definitions.
   */
  crons?: string;
  /**
   * Directory that contains the `FormatChecker` definitions.
   */
  formatCheckers?: string;
}

type Constructor<T extends Base, U extends BaseConfig> = {
  new (config: U): T;
};

export class Bot {
  private readonly token?: string;
  private _client: Client | null;
  private _commands: Command[] = [];
  private _crons: Cron[] = [];
  private _formatCheckers: FormatChecker[] = [];

  public readonly logger: pino.Logger;

  public constructor(options: BotOptions = {}) {
    this.token = options.token;
    this._client = null;
    this.logger = pino();

    if (options.commands) {
      this._commands = this.loadDirectory(
        options.commands,
        'commands',
        Command,
      );
    }
    if (options.crons) {
      this._crons = this.loadDirectory(options.crons, 'crons', Cron);
    }
    if (options.formatCheckers) {
      this._formatCheckers = this.loadDirectory(
        options.formatCheckers,
        'format-checkers',
        FormatChecker,
      );
    }
  }

  private loadDirectory<T extends Base, U extends BaseConfig>(
    directory: string,
    name: string,
    constructor: Constructor<T, U>,
  ): T[] {
    let list: string[];
    try {
      list = fs.readdirSync(directory);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(
          `Failed to load "${name}" in ${directory}. Directory could not be read`,
        );
      }
      throw err;
    }

    const allExports = list.map((file) => {
      const filePath = path.join(directory, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const value = require(filePath);
      if (!value || !value.default || !(value.default instanceof constructor)) {
        throw new Error(
          `${filePath} must export an instance of ${constructor.name}`,
        );
      }
      return value.default as T;
    });

    const enabledExports = allExports.filter((element) => element.enabled);

    if (enabledExports.length === allExports.length) {
      this.logger.info(`Loaded ${enabledExports.length} ${constructor.name}`);
    } else {
      this.logger.info(
        `Loaded ${enabledExports.length} ${constructor.name} (${
          allExports.length - enabledExports.length
        } disabled)`,
      );
    }

    return enabledExports;
  }

  private verifyCommands() {
    this._commands.forEach((command, commandIndex) => {
      this._commands.forEach((otherCommand, otherCommandIndex) => {
        if (
          command.name === otherCommand.name &&
          commandIndex !== otherCommandIndex
        ) {
          throw new Error(
            `Bot has duplicated commands! ${command.name} already exists.`,
          );
        }
        command.alias?.forEach((alias) => {
          otherCommand.alias?.forEach((otherAlias) => {
            if (alias === otherAlias && commandIndex !== otherCommandIndex) {
              throw new Error(
                `Bot has duplicated alias for command ${command.name}! alias ${alias} from ${otherCommand.name} already exists. `,
              );
            }
          });
        });
      });
    });
  }

  private startCommands() {
    this._commands.forEach((command) => command.start(this));
  }

  private stopCommands() {
    this._commands.forEach((command) => command.stop(this));
  }

  private startCrons() {
    this._crons.forEach((cron) => cron.start(this));
  }

  private stopCrons() {
    this._crons.forEach((cron) => cron.stop());
  }

  private startFormatCheckers() {
    this._formatCheckers.forEach((formatChecker) => formatChecker.start(this));
  }

  private stopFormatCheckers() {
    this._formatCheckers.forEach((formatChecker) => formatChecker.stop(this));
  }

  /**
   * Returns the discord.js Client instance.
   * The bot must be started first.
   */
  public get client(): Client {
    if (!this._client) {
      throw new Error('Bot was not started');
    }

    return this._client;
  }

  public get commands(): Array<PublicCommand> {
    return this._commands.map((command) => ({
      name: command.name,
      alias: command.alias,
      description: command.description,
    }));
  }

  /**
   * Start the bot by connecting it to Discord.
   */
  public async start(): Promise<void> {
    if (this._client) {
      throw new Error('Bot can only be started once');
    }
    this._client = new Client();
    try {
      await Promise.all([
        this.client.login(this.token),
        once(this.client, 'ready'),
      ]);
      // To remove 'MaxListenersExceededWarning' warning in console
      this._client.setMaxListeners(this._commands.length);
      this.verifyCommands();
      this.startCommands();
      this.startCrons();
      this.startFormatCheckers();
    } catch (error) {
      this._client = null;
      throw error;
    }
  }

  /**
   * Stop the bot.
   */
  public stop(): void {
    if (!this._client) {
      throw new Error('Bot was not started');
    }
    this.stopCommands();
    this.stopCrons();
    this.stopFormatCheckers();
    this._client.destroy();
    this._client = null;
  }
}
