import Store from '../services/Store';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'nowplaying',
  description: 'Get the song that is playing.',
  alias: ['np'],
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.queue.get(message.guild.id);
    if (!serverQueue) {
      message.channel.send('There is nothing playing.');
      return;
    }
    message.channel.send(`Now playing: ${serverQueue.songs[0].title}`);
  },
});
