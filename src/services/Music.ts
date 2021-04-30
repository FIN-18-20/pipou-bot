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
  guild: string;
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      guild: message.guild!.id,
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    Store.musicQueues.set(musicQueue.guild, musicQueue);
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
    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!serverQueue || !serverQueue.connection) {
      return;
    }

    if (!song) {
      this.stop(serverQueue);
      return;
    }

    serverQueue.playing = true

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url, { filter: 'audioonly' }))
      .on('finish', () => {
        serverQueue.songs.shift();
        this.play(message, serverQueue.songs[0]);
      })
      .on('error', (error: Error) => {
        console.error(error);
      });

    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }

  leave(serverQueue: musicQueue) {
    Store.musicQueues.delete(serverQueue.guild);
  }

  stop(serverQueue: musicQueue) {
    serverQueue.playing = false
    serverQueue.songs = []
    serverQueue.connection?.dispatcher?.end();
  }
}

export default new Music();
