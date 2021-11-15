import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'remove',
  description: 'remove to the selected song from the queue.',
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
      message.channel.send('This is not possible to remove this!');
      return;
    }
    if (serverQueue.loop) {
      Music.toggleLoop(serverQueue);
    }
    serverQueue.songs.splice(index, 1);
  },
});
