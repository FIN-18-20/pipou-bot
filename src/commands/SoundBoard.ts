import { MessageEmbed } from 'discord.js';
import { Command } from '../framework';
import Music from '../services/Music';
import Store from '../services/Store';

export default new Command({
  enabled: true,
  name: 'sound',
  description: 'List soundboards sounds, for now.',
  alias: ['soundboard', 's'],
  async handle({ message }) {
    if (!message.guild) return;
    const args = message.content.split(/ +/).slice(1);

    if (!args.length) {
      const embed = new MessageEmbed()
        .setColor('#FBBF24')
        .setTitle('Available sounds');

      embed.setDescription(Array.from(Store.sounds.keys()).join('\n'));

      message.channel.send(embed);
      return;
    }

    const soundPath = Store.sounds.get(args[0].toLowerCase());
    if (!soundPath) {
      message.channel.send('Sound not found!');
      return;
    }

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (serverQueue && serverQueue.connection) {
      const previousSongTimer = serverQueue.connection.dispatcher.streamTime;

      // const oldConnection = serverQueue.connection;
      Music.pause(serverQueue);
      const soundConnection = await message.member?.voice.channel?.join();
      soundConnection?.play(soundPath).on('finish', () => {
        // serverQueue.connection = oldConnection;
        Music.resume(serverQueue, previousSongTimer);
      });
    } else {
      const soundConnection = await message.member?.voice.channel?.join();
      soundConnection?.play(soundPath);
    }
  },
});
