import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'stop',
  description: 'Stop all songs in the queue.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!message.member?.voice.channel || !serverQueue) {
      message.channel.send(
        'You have to be in a voice channel to stop the music!',
      );
      return;
    }
    Music.stop(serverQueue);
    message.channel.send('Music has been stopped.');
  },
});
