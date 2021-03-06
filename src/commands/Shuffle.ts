import Store from '../services/Store';
import { Command, shuffle } from '../framework';

export default new Command({
  enabled: true,
  name: 'shuffle',
  description: 'Shuffle the songs in the queue.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to skip the music!',
      );
      return;
    }
    if (!serverQueue || serverQueue.songs.length < 2) {
      message.channel.send('There is not enough songs to shuffle the list!');
      return;
    }

    serverQueue.songs = [
      serverQueue.songs[0],
      ...shuffle(serverQueue.songs.slice(1)),
    ];

    message.channel.send('**Shuffled queue :ok_hand:**');
  },
});
