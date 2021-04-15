import { MessageEmbed } from 'discord.js';
import { Command, ErrorEmbed } from '../framework';

export default new Command({
  enabled: true,
  name: 'pin',
  description: 'Pin a message by its messageId.',
  async handle({ message }) {
    const args = message.content.split(/ +/).slice(1);
    const id = args[0];

    try {
      const msg = await message.channel.messages.fetch(id);
      await msg.pin();

      await Promise.all([
        message.channel.lastMessage?.delete(),
        message.delete(),
      ]);

      const embed = new MessageEmbed().setColor('#6EE7B7').addFields({
        name: '📌  Pin',
        value: `A [message](${msg.url}) was pinned by ${message.author.username}.`,
      });
      message.channel.send(embed);
    } catch (e) {
      message.channel
        .send(ErrorEmbed("The message you try to pin doesn't exist."))
        .catch(console.error);
    }
  },
});
