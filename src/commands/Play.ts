import { Command } from '../framework';
import ytdl from 'ytdl-core';
import Store from '../services/Store';
import Music from '../services/Music';
import Youtube from '../services/YouTube';

export default new Command({
  enabled: true,
  name: 'play',
  description: 'Play a youtube music.',
  async handle({ message, logger }) {
    const args = message.content.split(/ +/).slice(1);
    if (!message.member || !message.client.user || !message.guild) return;

    const guildId = message.guild.id;

    if (!args.length) {
      message.reply('Invalid syntax.');
      return;
    }

    const validate = ytdl.validateURL(args[0]);
    // Valid Video URL
    if (args[0].startsWith('http') && !validate) {
      message.reply('Please input a **valid** URL.');
      return;
    } else {
      // Search video
      const query = args.join(' ');
      const videos = await Youtube.search(query);
      args[0] = `https://www.youtube.com/watch?v=${videos[0].id}`;
    }

    const serverQueue = Store.musicQueues.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send('You need to be in a voice channel to play music!');
      return;
    }
    const song = await Music.getSongInfo(args[0]);

    if (!serverQueue) {
      const musicQueue = Music.createQueue(message, voiceChannel);
      musicQueue.songs.push(song);
      try {
        musicQueue.connection = await voiceChannel.join();
        musicQueue.connection.once('disconnect', () => {
          Store.musicQueues.delete(guildId);
        });

        Music.play(guildId, musicQueue.songs[0]);
      } catch (err) {
        logger.error(err);
        Store.musicQueues.delete(message.guild.id);
        message.channel.send(err);
        return;
      }
    } else {
      serverQueue.songs.push(song);
      if (!serverQueue.playing) {
        Music.play(guildId, serverQueue.songs[0]);
      } else {
        message.channel.send(`${song.title} has been added to the queue!`);
      }
      return;
    }
  },
});
