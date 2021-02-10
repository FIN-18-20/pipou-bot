import Store from '../services/Store';
import { Command, secToTime } from '../framework';
import { MessageEmbed } from 'discord.js';

export default new Command({
  enabled: true,
  name: 'nowplaying',
  description: 'Get the song that is playing.',
  alias: ['np'],
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!serverQueue) {
      message.channel.send('There is nothing playing.');
      return;
    }
    const song = serverQueue.songs[0];
    const streamTime = serverQueue.connection?.dispatcher.streamTime || 0;
    const description = [
      `[${song.title}](${song.url})`,
      `\`${secToTime(streamTime / 1000)}/${secToTime(song.duration)}\``,
    ];

    const embed = new MessageEmbed()
      .setColor('#FBBF24')
      .setTitle('Now playing')
      .setDescription(description.join('\n'));

    message.channel.send(embed);
  },
});
