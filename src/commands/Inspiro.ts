import got from 'got';
import { MessageEmbed } from 'discord.js';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'inspiro',
  description: 'InspiroBot random image.',
  async handle({ message }) {
    const { body } = await got.get('https://inspirobot.me/api?generate=true');

    const embed = new MessageEmbed()
      .setColor('#10B981')
      .setTitle('InspiroBot')
      .setURL('https://inspirobot.me')
      .setImage(body);

    message.channel.send(embed);
  },
});
