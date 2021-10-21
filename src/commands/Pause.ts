import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'pause',
  description: 'Pause the current playing song.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!serverQueue || !serverQueue.playing) {
      return;
    }
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to pause the music!',
      );
      return;
    }
    Music.pause(serverQueue);
    message.channel.send('Music has been paused.');
  },
});
