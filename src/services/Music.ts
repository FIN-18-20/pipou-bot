import ytdl from 'ytdl-core';
import {
  DMChannel,
  Message,
  NewsChannel,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from 'discord.js';
import Store from './Store';

export interface queueContruct {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: null | VoiceConnection;
  songs: Array<Record<string, string>>;
  volume: number;
  playing: boolean;
}

class Music {
  createQueue(message: Message, voiceChannel: VoiceChannel) {
    const queueContruct: queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    Store.queue.set(message.guild?.id, queueContruct);
    return queueContruct;
  }
  async getSongInfo(url: string) {
    const songInfo = await ytdl.getInfo(url);
    return {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };
  }
  async play(message: Message, song: Record<string, string>): Promise<void> {
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
        this.play(message, serverQueue.songs[0]);
      })
      .on('error', (error: Error) => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }

  stop(serverQueue: queueContruct) {
    serverQueue.songs = [];
    serverQueue.connection?.dispatcher.end();
  }
}

export default new Music();
