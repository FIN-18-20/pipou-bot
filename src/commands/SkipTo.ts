import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'skipto',
  description: 'Skip to the selected song.',
  async handle({ message }) {
    if (!message.guild) return;
    const args = message.content.split(/ +/).slice(1);
    if (!args.length) {
      message.reply('Invalid syntax.');
      return;
    }
    const index = parseInt(args[0]);
    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to skip the music!',
      );
      return;
    }
    if (
      !serverQueue ||
      isNaN(index) ||
      serverQueue.songs.length - 1 < index ||
      index <= 0
    ) {
      message.channel.send('This is not possible to skip to this!');
      return;
    }
    if (serverQueue.loop) {
      Music.toggleLoop(serverQueue);
    }
    serverQueue.songs.splice(0, index - 1);
    serverQueue.connection?.dispatcher?.end();
  },
});
