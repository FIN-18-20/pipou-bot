import ytdl from 'ytdl-core';
import {
  DMChannel,
  Message,
  NewsChannel,
  StreamDispatcher,
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
  dispatcher: StreamDispatcher | null;
  currentSong?: Song;
  currentSongPauseTimer?: number;
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
      dispatcher: null,
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

  async play(id: string, song?: Song, timer = 0): Promise<void> {
    const serverQueue = Store.musicQueues.get(id);
    if (!serverQueue || !serverQueue.connection) {
      return;
    }

    if (!song) {
      this.stop(serverQueue);
      return;
    }

    serverQueue.playing = true;

    serverQueue.currentSong = song;
    serverQueue.dispatcher = serverQueue.connection
      .play(ytdl(song.url, { filter: 'audioonly' }), { seek: timer })
      .on('finish', () => {
        serverQueue.songs.shift();
        this.play(id, serverQueue.songs[0]);
      })
      .on('error', (error: Error) => {
        console.error(error);
      });

    serverQueue.dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
  }

  pause(serverQueue: musicQueue) {
    serverQueue.playing = false;
    serverQueue.currentSongPauseTimer =
      serverQueue.connection?.dispatcher?.streamTime;
    serverQueue.dispatcher?.pause();
  }

  resume(serverQueue: musicQueue) {
    if (!serverQueue.connection || !serverQueue.currentSong) {
      return;
    }

    const timer = serverQueue.currentSongPauseTimer ?? 0;

    this.play(
      serverQueue.guild,
      serverQueue.currentSong,
      Math.round(timer / 1000),
    );

    serverQueue.playing = true;
    serverQueue.currentSongPauseTimer = 0;
  }

  stop(serverQueue: musicQueue) {
    serverQueue.playing = false;
    serverQueue.currentSong = undefined;
    serverQueue.currentSongPauseTimer = undefined;
    serverQueue.songs = [];
    serverQueue.connection?.dispatcher?.end();
  }
}

export default new Music();
