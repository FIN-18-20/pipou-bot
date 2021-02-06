import { Command } from '../framework';
import axios from 'axios';
import { MessageEmbed } from 'discord.js';

export default new Command({
    enabled: true,
    name: 'ls',
    description: 'Leaguestats.gg',
    async handle({ message }) {
        const args = message.content.split(' ');
        const command = args.shift()!;

        if (args.length !== 1) return;

        axios.post('https://api.leaguestats.gg/summoner/basic', {
            summoner: args[0],
            region: 'euw1'
        })
            .then(response => {
                if (response.status === 204) {
                    message.channel.send('Summoner not found !');
                    return;
                }
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setURL('https://leaguestats.gg/summoner/euw/' + args[0])
                    .setAuthor('Leaguestats.gg', 'https://leaguestats.gg/favicon-16x16.png', 'https://leaguestats.gg/')
                    .setTitle(response.data.account.name)
                    .addFields(
                        { name: 'Level', value: response.data.account.summonerLevel }
                    );

                if(response.data.ranked.soloQ) {
                    embed.addField('Solo Queue', response.data.ranked.soloQ.fullRank + ' / ' + response.data.ranked.soloQ.winrate, true);
                }

                if(response.data.ranked.flex5v5) {
                    embed.addField('Flex 5v5', response.data.ranked.flex5v5.fullRank + ' / ' + response.data.ranked.flex5v5.winrate, true);
                }
                message.channel.send(embed).catch(console.error);
            })
            .catch(console.error);
    },
});