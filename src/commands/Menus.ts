import { MessageEmbed } from 'discord.js';
import got from 'got/dist/source';
import { DateTime, Info } from 'luxon';
import { capitalize, Command, ErrorEmbed } from '../framework';

interface MenusAPIResponse {
  monday: RawMenu;
  tuesday: RawMenu;
  wednesday: RawMenu;
  thursday: RawMenu;
  friday: RawMenu;
}

interface RawMenu {
  tradition: Array<string>;
  vegetarien: Array<string>;
}

export default new Command({
  enabled: true,
  name: 'menus',
  description: 'Display the menus of the week at the HEIG',
  async handle({ message }) {
    const { body: response } = await got<MenusAPIResponse>(
      'http://student-api.ddns.net:3001/menus',
      { responseType: 'json' },
    );

    if (!Object.keys(response).length) {
      message.channel.send(
        ErrorEmbed('The menus are not available :peepoSad:'),
      );
      return;
    }

    const today = DateTime.local().setLocale('fr-FR');
    const startWeek = today.startOf('week').toLocaleString(DateTime.DATE_FULL);
    const endWeek = today.endOf('week').toLocaleString(DateTime.DATE_FULL);

    const embed = new MessageEmbed()
      .setColor('#EA580C')
      .setTitle(`:fork_and_knife: Menus de la semaine ${today.weekNumber}`)
      .setThumbnail(
        'https://pbs.twimg.com/profile_images/1339474601097748480/PVp2lBhv_400x400.jpg',
      )
      .setFooter(`Semaine du ${startWeek} au ${endWeek}`);

    Object.values(response).map((menus, i) => {
      embed.addField(
        '-'.repeat(71),
        `**${capitalize(Info.weekdays('long')[i])}**`,
        false,
      );
      Object.entries(menus as RawMenu).map(([menuName, content]) => {
        const title = '```' + 'Menu ' + capitalize(menuName) + '```';
        embed.addField(title, content.join('\n'), true);
      });
    });

    message.channel.send(embed);
  },
});
