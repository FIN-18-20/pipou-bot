import { Command } from '../framework';
import ytdl from 'ytdl-core';
import Store from '../services/Store';
import Music, { Song } from '../services/Music';
import Youtube from '../services/YouTube';

export default new Command({
  enabled: true,
  name: 'play',
  description: 'Play a youtube music or playlist.',
  alias: ['p'],
  async handle({ message, logger }) {
    const args = message.content.split(/ +/).slice(1);
    if (!message.member || !message.client.user || !message.guild) return;

    const guildId = message.guild.id;

    if (!args.length) {
      message.reply('Invalid syntax.');
      return;
    }

    const validate = ytdl.validateURL(args[0]);
    let isPlaylist = false;
    let playlistId = null;

    // Valid Video URL
    if (args[0].startsWith('http') && !validate) {
      const match = args[0].match(/^.*(youtu.be\/|list=)([^#&?]*).*/);
      if (match && match[2]) {
        isPlaylist = true;
        playlistId = match[2];
      } else {
        message.reply('Please input a **valid** URL.');
        return;
      }
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

    const songsToAdd: Song[] = [];
    if (isPlaylist && playlistId) {
      const playlist = await Youtube.getPlaylist(playlistId).catch(() => null);
      if (!playlist) {
        message.reply('Please input a **valid** Playlist URL.');
        return;
      }
      const videos = await playlist.getVideos();
      videos.forEach((v) => {
        songsToAdd.push({
          title: v.title,
          url: v.url,
          duration: v.duration?.seconds || 0, // Todo: how to get duration without fetching every video
        });
      });
    } else {
      songsToAdd.push(await Music.getSongInfo(args[0]));
    }

    if (!serverQueue) {
      const musicQueue = Music.createQueue(message, voiceChannel);
      musicQueue.songs = songsToAdd;
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
      serverQueue.songs = [...serverQueue.songs, ...songsToAdd];
      const nextSong = serverQueue.songs[0];
      // If a sound is currently playing and no music before
      if (!serverQueue.currentSong) {
        serverQueue.currentSong = nextSong;
      }
      if (!serverQueue.playing) {
        Music.play(guildId, serverQueue.songs[0]);
      } else {
        const msg =
          songsToAdd.length > 1
            ? `**${songsToAdd.length}** sounds have`
            : `${nextSong.title} has`;

        message.channel.send(`${msg} been added to the queue!`);
      }
      return;
    }
  },
});
