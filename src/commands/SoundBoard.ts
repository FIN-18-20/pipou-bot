import { MessageEmbed } from 'discord.js';
import { Command, splitArray } from '../framework';
import Music from '../services/Music';
import Store from '../services/Store';

export default new Command({
  enabled: true,
  name: 'sound',
  description: 'List soundboards sounds, for now.',
  alias: ['soundboard', 's'],
  async handle({ message }) {
    if (!message.guild || !message.member) return;
    const args = message.content.split(/ +/).slice(1);

    if (!args.length) {
      const nbColumns = 3;
      const names = Array.from(Store.sounds.keys()).map(
        (name) => '```' + name + '```',
      );
      const splitNames = splitArray(names, Math.ceil(names.length / nbColumns));

      const embed = new MessageEmbed()
        .setColor('#FBBF24')
        .setTitle(`:loudspeaker:  ${Store.sounds.size} Available sounds`);

      for (let i = 0; i < nbColumns; ++i)
        embed.addField('\u200B', splitNames[i].join(''), true);

      message.channel.send(embed);
      return;
    }

    if (!message.member.voice.channel) {
      message.channel.send(
        'You need to be in a voice channel to play a sound!',
      );
      return;
    }

    const guildId = message.guild.id;
    const soundsFound = Store.soundNames.search(args.join('').toLowerCase());
    if (!soundsFound.length) {
      message.channel.send('Sound not found!');
      return;
    }
    const soundPath = Store.sounds.get(soundsFound[0].item);
    if (!soundPath) return;

    let serverQueue = Store.musicQueues.get(guildId);
    if (serverQueue && serverQueue.connection) {
      Music.pause(serverQueue);
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
      Music.resume(serverQueue!);
    });
  },
});
