import { Command } from '../framework';
import got from 'got';
import { MessageEmbed } from 'discord.js';

interface RankedStats {
  fullRank: string;
  winrate: string;
  shortName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

interface SummonerBasic {
  account: {
    name: string;
    profileIconId: number;
    summonerLevel: number;
  };
  // matchList: Array<any>;
  seasons: Array<number>;
  playing: boolean;
  ranked: {
    soloQ?: RankedStats;
    flex5v5?: RankedStats;
  };
}

export default new Command({
  enabled: true,
  name: 'ls',
  description: 'Leaguestats.gg',
  alias: ['leaguestats', 'league', 'riot', 'rito'],
  async handle({ message }) {
    const args = message.content.split(' ').slice(1);

    if (args === undefined || args.length !== 1) {
      message.channel.send(
        "Invalid Summoner! Don't add space to summoner names.",
      );
      return;
    }

    const summonerData: SummonerBasic = await got
      .post('https://api.leaguestats.gg/summoner/basic', {
        json: {
          summoner: args[0],
          region: 'euw1',
        },
        responseType: 'json',
      })
      .json();

    if (!summonerData) {
      message.channel.send('Summoner not found !');
      return;
    }

    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setURL('https://leaguestats.gg/summoner/euw/' + args[0])
      .setAuthor(
        'Leaguestats.gg',
        'https://leaguestats.gg/favicon-16x16.png',
        'https://leaguestats.gg/',
      )
      .setTitle(summonerData.account.name)
      .addFields({ name: 'Level', value: summonerData.account.summonerLevel });

    if (summonerData.ranked.soloQ) {
      embed.addField(
        'Solo Queue',
        summonerData.ranked.soloQ.fullRank +
          ' / ' +
          summonerData.ranked.soloQ.winrate,
        true,
      );
    }

    if (summonerData.ranked.flex5v5) {
      embed.addField(
        'Flex 5v5',
        summonerData.ranked.flex5v5.fullRank +
          ' / ' +
          summonerData.ranked.flex5v5.winrate,
        true,
      );
    }
    message.channel.send(embed).catch(console.error);
  },
});
