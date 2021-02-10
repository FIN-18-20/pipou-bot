import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'alex',
  description: 'Only the truth.',
  async handle({ message }) {
    message.channel.send('Alex tais toi 😡 !');
  },
});
