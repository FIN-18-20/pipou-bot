import { Command } from '../framework';
import { bot } from '../bot';
import { MessageEmbed, EmbedFieldData } from 'discord.js';

export default new Command({
  enabled: true,
  name: 'help',
  description: 'List all available commands.',
  async handle({ message }) {
    const embedFields: EmbedFieldData[] = [];
    bot.commands
      .filter((command) => command.name !== 'help')
      .forEach((current) => {
        const description = current.alias
          ? '[*' + current.alias.join(', ') + '*]' + '\n' + current.description
          : current.description;
        embedFields.push({
          name: current.name,
          value: description,
          inline: false,
        });
      });
    const embed = new MessageEmbed()
      .setColor('#2DD4BF')
      .setTitle('All available commands')
      .addFields(...embedFields);
    message.channel.send(embed);
  },
});
