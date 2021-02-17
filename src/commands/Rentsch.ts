import { Command } from '../framework';

export default new Command({
  enabled: true,
  name: 'rrh',
  description: 'Tell a truth about life.',
  async handle({ message }) {

    const fs = require('fs');

    fs.readFile("src/data/rrh.json", (err, data) => {
      if (err) throw err;
      const pipou = JSON.parse(data);
      const rdmnum = Math.floor(Math.random() * pipou.length); 
      const msg = pipou[rdmnum];

      message.channel.send(msg + " --Rentsch");
    });
  },
});
