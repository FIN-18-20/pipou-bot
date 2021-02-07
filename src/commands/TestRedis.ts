import Redis from '../services/Redis';
import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'redis',
  description: 'Test redis command',
  async handle({ message }) {
    const oldMsg = await Redis.get('yolo');
    message.channel.send("Contenu de l'ancien message: " + oldMsg);
    await Redis.set('yolo', message.content.slice(this.name.length + 2));
  },
});
