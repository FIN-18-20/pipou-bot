import { Command } from '../framework';
import ytdl from 'ytdl-core';
import Store from '../services/Store';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'play',
  description: 'Play youtube video',
  async handle({ message, logger }) {
    const args = message.content.split(' ');
    if (!message.member || !message.client.user || !message.guild) return;

    const validate = ytdl.validateURL(args[1]);
    if (!validate) {
      message.reply('Please input a **valid** URL.');
      return;
    }

    const serverQueue = Store.queue.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send('You need to be in a voice channel to play music!');
      return;
    }
    const song = await Music.getSongInfo(args[1]);

    if (!serverQueue) {
      const queueContruct = Music.createQueue(message, voiceChannel);
      queueContruct.songs.push(song);

      try {
        const connection = await voiceChannel.join();
        queueContruct.connection = connection;
        Music.play(message, queueContruct.songs[0]);
      } catch (err) {
        logger.error(err);
        Store.queue.delete(message.guild.id);
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
