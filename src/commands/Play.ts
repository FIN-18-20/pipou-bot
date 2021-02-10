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
    const args = message.content.split(/ +/);
    if (!message.member || !message.client.user || !message.guild) return;

    const validate = ytdl.validateURL(args[1]);
    // Valid Video URL
    if (args[1].startsWith('http') && !validate) {
      message.reply('Please input a **valid** URL.');
      return;
    } else {
      // Search video
      const query = args.slice(1).join(' ');
      const videos = await Youtube.search(query);
      args[1] = `https://www.youtube.com/watch?v=${videos[0].id}`;
    }

    const serverQueue = Store.musicQueues.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send('You need to be in a voice channel to play music!');
      return;
    }
    const song = await Music.getSongInfo(args[1]);

    if (!serverQueue) {
      const musicQueue = Music.createQueue(message, voiceChannel);
      musicQueue.songs.push(song);

      try {
        musicQueue.connection = await voiceChannel.join();
        musicQueue.connection.once('disconnect', () => {
          Store.musicQueues.delete(message.guild.id);
        });

        Music.play(message, musicQueue.songs[0]);
      } catch (err) {
        logger.error(err);
        Store.musicQueues.delete(message.guild.id);
        message.channel.send(err);
        return;
      }
    } else {
      serverQueue.songs.push(song);
      message.channel.send(`${song.title} has been added to the queue!`);
      return;
    }
  },
});
