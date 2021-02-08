import Store from '../services/Store';
import { Command, secToTime } from '../framework';
import { MessageEmbed } from 'discord.js';

export default new Command({
  enabled: true,
  name: 'queue',
  description: 'Display the songs in the queue.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.queue.get(message.guild.id);
    if (!serverQueue) {
      message.channel.send('There is no song in the queue!');
      return;
    }

    const songsPerPage = 25;
    const nbSongsInQueue = serverQueue.songs.length - 1;
    const pageNumber = 1;
    const pageTotal = Math.floor((nbSongsInQueue - 1) / songsPerPage) + 1;

    const embed = new MessageEmbed()
      .setColor('#FBBF24')
      .setTitle('Songs in queue');

    const nowPlaying = serverQueue.songs[0];
    const description = [
      '__Now Playing:__',
      `[${nowPlaying.title}](${nowPlaying.url}) | \`${secToTime(
        nowPlaying.duration,
      )}\` \n`,
    ];

    if (nbSongsInQueue > 0) {
      let totalDuration = 0;
      description.push('__Up next:__');
      for (let i = 0; i < Math.min(songsPerPage, nbSongsInQueue); i++) {
        const song = serverQueue.songs[i + 1];
        totalDuration += song.duration;
        description.push(
          `**${i + 1}.** [${song.title}](${song.url}) | \`${secToTime(
            song.duration,
          )}\``,
        );
      }
      description.push(
        `\n**${nbSongsInQueue} song${
          nbSongsInQueue > 1 ? 's' : ''
        } in queue | ${secToTime(totalDuration)}**`,
      );
      embed.setFooter(`Page ${pageNumber}/${pageTotal}`);
    }
    embed.setDescription(description.join('\n'));

    message.channel.send(embed);
  },
});
