import Store from '../services/Store';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'skip',
  description: 'Skip a song.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.queue.get(message.guild.id);
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to skip the music!',
      );
      return;
    }
    if (!serverQueue) {
      message.channel.send('There is no song that I could skip!');
      return;
    }
    serverQueue.connection.dispatcher.end();
  },
});
