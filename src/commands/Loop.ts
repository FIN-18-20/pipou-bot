import Store from '../services/Store';
import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'loop',
  description: 'Loop the current playing song.',
  async handle({ message }) {
    if (!message.guild) return;

    const serverQueue = Store.musicQueues.get(message.guild.id);
    if (!serverQueue || !serverQueue.playing) {
      return;
    }
    if (!message.member?.voice.channel) {
      message.channel.send(
        'You have to be in a voice channel to loop the music!',
      );
      return;
    }
    Music.toggleLoop(serverQueue);
    if(serverQueue.loop){
        message.channel.send('Music has been looped.');
    } else{
        message.channel.send('Music has been unlooped.');
    }
  },
});
