import Redis from '../services/Redis';
import { EmbedFieldData, MessageEmbed, TextChannel } from 'discord.js';
import { Command } from '../framework'

interface Homework {
  id: number;
  module: string;
  description: string;
  date: Date;
}

// TODO Put this function in Redis service ?
async function scanKeys(cursor: string, pattern: string): Promise<string[]> {
  const keys: string[] = []

  do {
    const scan = await Redis.scan(cursor, ['MATCH', pattern]);
    cursor = (scan[0] as string);
    keys.push(...(scan[1] as string[]));
  } while (cursor !== '0')

  return keys;
}

export default new Command({
  enabled: true,
  name: 'homework',
  alias: ['hw'],
  description: 'Manage homeworks. !hw help to show all commands.',
  async handle({ message }) {

    const args = message.content.match(/"[^"]*"|\S+/g)?.map(m => m.slice(0, 1) === '"' ? m.slice(1, -1) : m);
    const channelName = (message.channel as TextChannel).name

    if (!message.member?.roles.cache.find(r => r.name === 'HEIG') && message.guild?.name === 'Kaelin') {
      message.reply("You need to be a HEIG-VD student to use this command.");
      return;
    }

    if (args == undefined || args.length === 1) {
      message.channel.send("Invalid arguments. !hw help to see command synthax.");
      return;
    }

    // ANCHOR ADD command
    // TODO Pre-condition : validate args || Use Luxon for date manipulation
    if (args[1] === "add" && args.length === 4) {
      const description = args[2];
      const date = args[3].split('.')

      const homework: Homework = {
        id: Date.now(),
        module: channelName,
        description: description,
        date: new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0])) // Fuck this shit
      }

      const key = 'hw-' + channelName + '-' + homework.id;
      const ttl = Math.floor(Math.abs((homework.date.getTime() - Date.now()) / 1000)) + 86400; // + one day

      await Redis.setex(key, ttl, JSON.stringify(homework));

      const embed = new MessageEmbed()
        .setColor('#fad541')
        .setTitle('Homework added for ' + channelName)
        .setDescription('ID: ' + homework.id)
        .addFields(
          { name: 'Due for ' + homework.date.toLocaleDateString('fr-FR'), value: homework.description }
        )
      message.channel.send(embed);
      return;
    }

    // ANCHOR SHOW command
    // TODO refactor repeating code with show-all
    if (args[1] === "show" && args.length === 2) {

      const keys = await scanKeys('0', 'hw-' + channelName + '-*');

      if (keys.length) {
        const embedFields: EmbedFieldData[] = [];

        for (const [index, key] of keys.entries()) {
          const data = await Redis.get(key);

          if (data != null) {
            const homework: Homework = JSON.parse(data);
            const date = new Date(homework.date);

            const name = (index + 1) + '. ' + homework.description;
            const value: string = 'Due for ' + date.toLocaleDateString('fr-FR') + '\n ID: ' + homework.id;

            embedFields.push({ name: name, value: value, inline: false })
          }
        }

        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homeworks for ' + channelName)
          .addFields(...embedFields)
        message.channel.send(embed);
        return;

      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework for ' + channelName)
        message.channel.send(embed);
        return;
      }
    }

    // ANCHOR SHOW-ALL command
    if (args[1] === "show-all" && args.length === 2) {

      const keys = await scanKeys('0', 'hw-*');

      if (keys.length) {
        const embedFields: EmbedFieldData[] = [];

        for (const [index, key] of keys.entries()) {
          const data = await Redis.get(key);

          if (data != null) {
            const homework: Homework = JSON.parse(data);
            const date = new Date(homework.date);

            const name = (index + 1) + '. [' + homework.module + '] ' + homework.description;
            const value: string = 'Due for ' + date.toLocaleDateString('fr-FR') + '\n ID: ' + homework.id;

            embedFields.push({ name: name, value: value, inline: false })
          }
        }

        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homeworks for all courses')
          .addFields(...embedFields)
        message.channel.send(embed);
        return;

      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework Pog!')
        message.channel.send(embed);
        return;
      }
    }

    // ANCHOR DELETE command
    if (args[1] == "delete" && args.length === 3) {
      const id = args[2];
      const keys = await scanKeys('0', 'hw-*-' + id)
      if (keys.length) {
        await Redis.del(keys[0]);
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homework with ID ' + id + ' has been deleted.')
        message.channel.send(embed);
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework found with ID ' + id)
        message.channel.send(embed);
      }
      return;
    }

    // ANCHOR MODIFY command
    if (args[1] === "modify" && args.length >= 4 && args.length <= 5) {
      const id = args[2];
      const keys = await scanKeys('0', 'hw-*-' + id)
      if (keys.length) {
        const homework: Homework = JSON.parse(await Redis.get(keys[0]));

        if (args.length === 5) {
          const description = args[3];
          const date = args[4].split('.')
          homework.description = description;
          homework.date = new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0]));
        }

        // NOTE Meaning one option was skipped
        if (args.length === 4) {
          // TODO Need to add Luxon to make it easy to identify/validate dates.
        }

        const ttl = Math.floor(Math.abs((homework.date.getTime() - Date.now()) / 1000)) + 86400;
        await Redis.setex(keys[0], ttl, JSON.stringify(homework));

        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('Homework modified for ' + channelName)
          .setDescription('ID: ' + homework.id)
          .addFields(
            { name: 'Due for ' + homework.date.toLocaleDateString('fr-FR'), value: homework.description }
          )
        message.channel.send(embed);
        return;
      } else {
        const embed = new MessageEmbed()
          .setColor('#fad541')
          .setTitle('No homework found with ID ' + id)
        message.channel.send(embed);
      }
      return;
    }

    // ANCHOR HELP command
    if (args[1] === "help") {
      const embed = new MessageEmbed()
        .setColor('#fad541')
        .setTitle('Homework commands')
        .setDescription('Manage homeworks for a specific HEIG-VD module. \n Alias: [hw, homework]')
        .addFields(
          { name: 'Add homework', value: '!hw add "Homework description" jj.mm.yyyy' },
          { name: 'Show homeworks (channel bound)', value: '!hw show' },
          { name: 'Show all homeworks', value: '!hw show-all' },
          { name: 'Delete homework', value: '!hw delete homework-id' },
          { name: 'Modify homework (not working yet)', value: '!hw modify homework-id [optional] "New description" [optional] jj.mm.yyyy' },
        )
      message.channel.send(embed);
      return;
    }
    message.channel.send("Invalid arguments. !hw help to see command synthax.");
  },
});