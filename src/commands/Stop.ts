import Store from '../services/Store';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'stop',
  description: 'Stop all songs in the queue',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.queue.get(message.guild.id);
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to stop the music!',
      );
      return;
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    message.channel.send('Music has been stopped.');
  },
});
