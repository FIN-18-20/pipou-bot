import { MessageEmbed } from 'discord.js';
import { Command, ErrorEmbed, isNumber, shuffle } from '../framework';

export default new Command({
  enabled: true,
  name: 'group',
  description: 'Create random groups from a list of names.',
  async handle({ message }) {
    const names = message.content.split(/ +/).slice(1);
    const strSize = names.pop();

    if (!isNumber(strSize)) {
      message.channel.send(
        ErrorEmbed(
          'Invalid format, example: ``!group Joe Bob Dany Mélissandre 2``',
        ),
      );
      return;
    }

    const size = Number(strSize);
    if (names.length < size) {
      message.channel.send(ErrorEmbed('Size is too big you dumbo.'));
      return;
    }

    const embed = new MessageEmbed()
      .setColor('#EA580C')
      .setTitle('🎡 **Random Groups** 🎡');
    const shuffled = shuffle(names);
    const description = [];

    let i = 0;
    let group = 0;
    for (const name of shuffled) {
      if (i++ % size === 0) {
        description.push(`\n**Group ${++group}**`);
      }
      description.push(name);
    }

    embed.setDescription(description.join('\n'));
    embed.setFooter(
      `Groups created randomly at ${new Date().toLocaleTimeString('en-GB')}.`,
    );

    message.channel.send(embed);
  },
});
