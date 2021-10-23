import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'resume',
  description: 'resume the current stopped song.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!serverQueue || serverQueue.playing) {
      return;
    }
    if (!message.member?.voice.channel) {
      message.channel.send('You have to be in a voice channel to play music!');
      return;
    }
    Music.resume(serverQueue);
    message.channel.send(
      `Resuming the song: **${serverQueue.songs[0].title}**`,
    );
  },
});
