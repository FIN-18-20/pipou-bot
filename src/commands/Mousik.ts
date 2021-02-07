import { Command } from '../framework';
import ytdl from 'ytdl-core';
import Store from '../services/Store';

import {
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';

interface queueContruct {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: null | VoiceConnection;
  songs: Array<Record<string, string>>;
  volume: number;
  playing: boolean;
}

export default new Command({
  enabled: true,
  name: 'mousik',
  description: 'Play some mousik',
  async handle({ message, logger }) {
    const args = message.content.split(' ');
    if (!message.member || !message.client.user || !message.guild) return;

    const validate = ytdl.validateURL(args[1]);
    if (!validate) {
      message.reply('Please input a **valid** URL.');
      return;
    }

    const serverQueue: queueContruct = Store.queue.get(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send('You need to be in a voice channel to play music!');
      return;
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    if (!serverQueue) {
      const queueContruct: queueContruct = {
        textChannel: message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: 5,
        playing: true,
      };

      Store.queue.set(message.guild.id, queueContruct);

      queueContruct.songs.push(song);

      try {
        const connection = await voiceChannel.join();
        queueContruct.connection = connection;
        play(message, queueContruct.songs[0]);
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

async function play(message: Message, song: Record<string, string>) {
  if (!message.guild) return;
  const serverQueue: queueContruct = Store.queue.get(message.guild.id);

  if (!song || !serverQueue.connection) {
    serverQueue.voiceChannel.leave();
    Store.queue.delete(message.guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url, { filter: 'audioonly' }))
    .on('finish', () => {
      serverQueue.songs.shift();
      play(message, serverQueue.songs[0]);
    })
    .on('error', (error: Error) => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}
