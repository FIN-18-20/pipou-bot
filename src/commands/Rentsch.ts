import Store from '../services/Store';
import { Command } from '../framework';
import { MessageEmbed } from 'discord.js';

export default new Command({
  enabled: true,
  name: 'rrh',
  description: 'Tell a truth about life.',
  async handle({ message }) {
    const random = Math.floor(Math.random() * Store.rrhQuotes.length);
    const msg = Store.rrhQuotes[random];
    const embed = new MessageEmbed().setDescription(msg).setFooter('© Rentsch');

    message.channel.send(embed);
  },
});
