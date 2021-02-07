import { Command } from '../framework';
import { bot } from '../bot';
import { MessageEmbed } from 'discord.js';

export default new Command({
  enabled: true,
  name: 'help',
  description: 'List all available commands.',
  async handle({ message }) {
    const embed = new MessageEmbed()
      .setColor('#2DD4BF')
      .setTitle('All available commands')
      .setDescription(
        bot.commands
          .filter((command) => command.name !== 'help')
          .reduce((agg, current) => {
            return (agg += `**${current.name}:** ${current.description} \n`);
          }, ''),
      );
    message.channel.send(embed);
  },
});
