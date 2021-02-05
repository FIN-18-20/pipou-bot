import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'alex',
  description: 'Test command',
  async handle({ message }) {
    message.channel.send('Alex tais toi 😡 !');
  },
});
