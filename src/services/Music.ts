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

export interface Song {
  title: string;
  url: string;
  duration: number;
}

export interface musicQueue {
  textChannel: TextChannel | DMChannel | NewsChannel;
  voiceChannel: VoiceChannel;
  connection: null | VoiceConnection;
  songs: Array<Song>;
  volume: number;
  playing: boolean;
}

class Music {
  createQueue(message: Message, voiceChannel: VoiceChannel) {
    const musicQueue: musicQueue = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Store.queue.set(message.guild!.id, musicQueue);
    return musicQueue;
  }
  async getSongInfo(url: string): Promise<Song> {
    const songInfo = await ytdl.getInfo(url);
    return {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
      duration: Number(songInfo.videoDetails.lengthSeconds),
    };
  }
  async play(message: Message, song: Song): Promise<void> {
    if (!message.guild) return;
    const serverQueue = Store.queue.get(message.guild.id);
    if (!serverQueue) {
      return;
    }

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

  stop(serverQueue: musicQueue) {
    serverQueue.songs = [];
    serverQueue.connection?.dispatcher.end();
  }
}

export default new Music();
