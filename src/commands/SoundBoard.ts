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
    if (!message.guild || !message.member || !message.member.voice.channel)
      return;
    const args = message.content.split(/ +/).slice(1);

    if (!args.length) {
      const embed = new MessageEmbed()
        .setColor('#FBBF24')
        .setTitle('Available sounds');

      embed.setDescription(Array.from(Store.sounds.keys()).join('\n'));

      message.channel.send(embed);
      return;
    }

    const guildId = message.guild.id;
    const soundPath = Store.sounds.get(args[0].toLowerCase());
    if (!soundPath) {
      message.channel.send('Sound not found!');
      return;
    }

    let serverQueue = Store.musicQueues.get(guildId);
    let previousSongTimer = 0;
    if (serverQueue && serverQueue.connection) {
      // const oldConnection = serverQueue.connection;
      previousSongTimer = serverQueue.connection?.dispatcher?.streamTime;
      Music.pause(serverQueue);
      // const soundConnection = await message.member?.voice.channel?.join();
      // serverQueue.connection = oldConnection;
    }
    // Create connection
    else {
      const voiceChannel = message.member.voice.channel;
      serverQueue = Music.createQueue(message, voiceChannel);
      serverQueue.connection = await voiceChannel.join();
      serverQueue.connection.once('disconnect', () => {
        Store.musicQueues.delete(guildId);
      });
    }

    serverQueue.connection.play(soundPath).on('finish', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Music.resume(serverQueue!, previousSongTimer);
    });
  },
});
