import Redis from '../services/Redis';
import { MessageEmbed, TextChannel } from 'discord.js';
import { Command } from '../framework'

interface Homework {
  id: number;
  module: string;
  description: string;
  date: Date;
}

export default new Command({
  enabled: true,
  name: 'homework',
  alias: ['hw'],
  description: 'Manage homeworks. hw help to show all commands.',
  async handle({ message }) {

    const args = message.content.match(/"[^"]*"|\S+/g)?.map(m => m.slice(0, 1) === '"'? m.slice(1, -1): m);

    // TODO Refactor after implementing all the commands
    if (args == undefined || args.length === 1) {
      message.channel.send("Invalid arguments. hw help to see command synthax.");
      return;
    }

    // ADD command
    // TODO Pre-condition : validate args || Use Luxon for date manipulation
    if (args[1] === "add" && args.length === 4) {
      const description = args[2];
      const date = args[3].split('.')
      const channelName = (message.channel as TextChannel).name

      const homework: Homework = {
        id: Date.now(),
        module: channelName,
        description: description,
        date: new Date(Number(date[2]), Number(date[1]) - 1, Number(date[0])) // Fuck this shit
      }

      const key = channelName + '-' + homework.id;
      const ttl = Math.floor(Math.abs((homework.date.getTime() - Date.now()) /1000)) + 86400; // + one day

      await Redis.setex(key, ttl , JSON.stringify(homework));

      const embed = new MessageEmbed()
        .setColor('#2DD4BF')
        .setTitle('Homework added for ' + channelName)
        .setDescription('Homework id: ' + homework.id)
        .addFields(
          { name: 'For ' + date.toLocaleString(), value: description }
        )
      message.channel.send(embed);
    }

    // HELP command
    if (args[1] === "help") {
      const embed = new MessageEmbed()
        .setColor('#2DD4BF')
        .setTitle('Homework commands')
        .setDescription('Manage homeworks for a specific HEIG-VD module. \n Alias: [hw, homework]')
        .addFields(
          { name: 'Add homework', value: '!hw add "Homework description" jj.mm.yyyy' },
          { name: 'Show homeworks (channel bound)', value: '!hw show' },
          { name: 'Show all homeworks', value: '!hw show-all' },
          { name: 'Delete homework', value: '!hw delete homework-id' },
          { name: 'Modify homework', value: '!hw modify homework-id (optional) "New description" (optional) jj.mm.yyyy' },
        )
      message.channel.send(embed);
    }
  },
});