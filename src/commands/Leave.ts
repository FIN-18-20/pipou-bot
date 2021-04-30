import Music from '../services/Music';
import Store from '../services/Store';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'leave',
  description: 'Disconnect the bot from the Vocal.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (serverQueue) {
      Music.stop(serverQueue);
      serverQueue.voiceChannel.leave();
      Store.musicQueues.delete(message.guild.id);
      message.channel.send('Pipou has been disconnected.');
    }
  },
});
