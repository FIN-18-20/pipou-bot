import Redis from '../services/Redis';
import { EmbedFieldData, MessageEmbed, TextChannel } from 'discord.js';
import { Command } from '../framework';
import { DateTime, Interval } from 'luxon';

interface Homework {
  id: number;
  module: string;
  description: string;
  date: string;
}

async function addEmbedFields(
  keys: string[],
  showModule: boolean,
): Promise<EmbedFieldData[]> {
  const embedFields: EmbedFieldData[] = [];
  const homeworks: Homework[] = await Promise.all(
    keys.map(async (key) => {
      const data = await Redis.get(key);
      return data ? JSON.parse(data) : null;
    }),
  );

  homeworks
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((homework, index) => {
      const moduleName = showModule ? '. [' + homework.module + '] ' : '. ';
      const name = index + 1 + moduleName + homework.description;
      const value: string =
        'Due for ' +
        DateTime.fromISO(homework.date).toLocaleString({ locale: 'fr' }) +
        '\n ID: ' +
        homework.id;

      embedFields.push({ name: name, value: value, inline: false });
    });
  return embedFields;
}

export default new Command({
  enabled: true,
  name: 'homework',
  alias: ['hw'],
  description: 'Manage homeworks. !hw help to show all commands.',
  async handle({ message }) {
    const args = message.content
      .match(/"[^"]*"|\S+/g)
      ?.map((m) => (m.slice(0, 1) === '"' ? m.slice(1, -1) : m));
    const channelName = (message.channel as TextChannel).name;

    if (
      !message.member?.roles.cache.find((r) => r.name === 'HEIG') &&
      message.guild?.name === 'Kaelin'
    ) {
      message.reply('You need to be a HEIG-VD student to use this command.');
      return;
    }

    if (args == undefined || args.length === 1) {
      message.channel.send(
        'Invalid arguments. !hw help to see command synthax.',
      );
      return;
    }

    // ANCHOR ADD command
    if (args[1] === 'add' && args.length === 4) {
      const description = args[2];
      const date = DateTime.fromFormat(args[3], 'dd.MM.yyyy', { locale: 'fr' });
      const homework: Homework = {
        id: Date.now(),
        module: channelName,
        description: description,
        date: date.toISO(),
      };

      if (!date.isValid || date < DateTime.local()) {
        message.channel.send(
          'Invalid date argument. Correct date synthax is dd.mm.yyyy.',
        );
        return;
      }

      const key = 'hw-' + channelName + '-' + homework.id;
      const ttl =
        Math.floor(
          Math.abs(
            Interval.fromDateTimes(DateTime.local(), date).length('seconds'),
          ),
        ) + 86400; // + one day
      await Redis.setex(key, ttl, JSON.stringify(homework));

      const embed = new MessageEmbed()
        .setColor('#fad541')
        .setTitle('Homework added for ' + channelName)
        .setDescription('ID: ' + homework.id)
        .addFields({
          name: 'Due for ' + date.toLocaleString(),
          value: homework.description,
        });
      message.channel.send(embed);
      return;
    }

    // ANCHOR SHOW command
    if (args[1] === 'show' && args.length === 2) {
      const keys = await Redis.scanMatchingKeys(
        '0',
        'hw-' + channelName + '-*',
      );
      if (keys.length) {
        const embedFields = await addEmbedFields(keys, false);
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homeworks for ' + channelName)
          .addFields(...embedFields);
        message.channel.send(embed);
        return;
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework for ' + channelName);
        message.channel.send(embed);
        return;
      }
    }

    // ANCHOR SHOW-ALL command
    if (args[1] === 'show-all' && args.length === 2) {
      const keys = await Redis.scanMatchingKeys('0', 'hw-*');
      if (keys.length) {
        const embedFields = await addEmbedFields(keys, true);
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homeworks for all courses')
          .addFields(...embedFields);
        message.channel.send(embed);
        return;
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework Pog!');
        message.channel.send(embed);
        return;
      }
    }

    // ANCHOR DELETE command
    if (args[1] == 'delete' && args.length === 3) {
      const id = args[2];
      const keys = await Redis.scanMatchingKeys('0', 'hw-*-' + id);
      if (keys.length) {
        await Redis.del(keys[0]);
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homework with ID ' + id + ' has been deleted.');
        message.channel.send(embed);
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework found with ID ' + id);
        message.channel.send(embed);
      }
      return;
    }

    // ANCHOR MODIFY command
    if (args[1] === 'modify' && args.length >= 4 && args.length <= 5) {
      const id = args[2];
      const keys = await Redis.scanMatchingKeys('0', 'hw-*-' + id);
      if (keys.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const homework: Homework = JSON.parse((await Redis.get(keys[0]))!);

        if (args.length === 5) {
          homework.description = args[3];
          homework.date = DateTime.fromFormat(args[4], 'dd.MM.yyyy', {
            locale: 'fr',
          }).toISO();
        }

        if (args.length === 4) {
          const date = DateTime.fromFormat(args[3], 'dd.MM.yyyy', {
            locale: 'fr',
          });
          if (!date.isValid || date < DateTime.local()) {
            // Check if the argument was meant to be the description by checking if it has at least one letter.
            if (/^.*[a-zA-Z]+.*$/.test(args[3])) {
              homework.description = args[3];
            } else {
              message.channel.send(
                'Invalid arguments. !hw help to see command synthax.',
              );
              return;
            }
          } else {
            homework.date = date.toISO();
          }
        }

        const ttl =
          Math.floor(
            Math.abs(
              Interval.fromDateTimes(
                DateTime.local(),
                DateTime.fromISO(homework.date),
              ).length('seconds'),
            ),
          ) + 86400;
        await Redis.setex(keys[0], ttl, JSON.stringify(homework));

        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homework modified for ' + homework.module)
          .setDescription('ID: ' + homework.id)
          .addFields({
            name:
              'Due for ' +
              DateTime.fromISO(homework.date).toLocaleString({ locale: 'fr' }),
            value: homework.description,
          });
        message.channel.send(embed);
        return;
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework found with ID ' + id);
        message.channel.send(embed);
      }
      return;
    }

    // ANCHOR HELP command
    if (args[1] === 'help') {
      const embed = new MessageEmbed()
        .setColor('#fad541')
        .setTitle('Homework commands')
        .setDescription(
          'Manage homeworks for a specific HEIG-VD module. \n Alias: [hw, homework]',
        )
        .addFields(
          {
            name: 'Add homework',
            value: '!hw add "Homework description" dd.mm.yyyy',
          },
          { name: 'Show homeworks (channel bound)', value: '!hw show' },
          { name: 'Show all homeworks', value: '!hw show-all' },
          { name: 'Delete homework', value: '!hw delete homework-id' },
          {
            name: 'Modify homework',
            value:
              '!hw modify homework-id [optional] "New description" [optional] dd.mm.yyyy',
          },
        );
      message.channel.send(embed);
      return;
    }
    message.channel.send('Invalid arguments. !hw help to see command synthax.');
  },
});
