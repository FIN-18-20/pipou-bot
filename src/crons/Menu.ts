import { MessageEmbed } from 'discord.js';
import got from 'got';

import { Cron, findTextChannelByName } from '../framework';

export default new Cron({
  enabled: true,
  name: 'Menu',
  description:
    'Check each day the lunch menu and post it in the #menu channel.',
  schedule: '0 8 * * 1-5',
  async handle(context) {
    const menus = await getTodayMenu();
    if (!menus) return;

    const channel = findTextChannelByName(context.client, 'menu');
    if (!channel) {
      throw new Error('found no #menu channel');
    }

    const day = new Date().toLocaleDateString('fr-FR', {
      timeZone: 'Europe/Zurich',
      weekday: 'long',
    });

    const date = new Date().toLocaleDateString('fr-FR', {
      timeZone: 'Europe/Zurich',
      dateStyle: 'full',
    });

    const embed = new MessageEmbed()
      .setColor('#EA580C')
      .setTitle(`:fork_and_knife: Menus de ${day}`)
      .setThumbnail(
        'https://pbs.twimg.com/profile_images/1339474601097748480/PVp2lBhv_400x400.jpg',
      )
      .setFooter(date);

    for (let i = 0; i < menus.length; i++) {
      const title = '```' + 'Menu' + (i + 1) + '```';
      embed.addField(title, menus[i].join('\n'), true);
    }

    await channel.send(embed);
  },
});

interface MenuAPIResponse {
  date: string;
  menus: Array<RawMenu>;
}

interface RawMenu {
  starter: string;
  mainCourse: Array<string>;
  dessert: string;
  containsPork: boolean;
}

type Menu = Array<string>;

async function getTodayMenu(): Promise<Array<Menu> | null> {
  const { body: response } = await got<MenuAPIResponse>(
    'https://apix.blacktree.io/top-chef/today',
    { responseType: 'json' },
  );

  if (!response || !response.menus.length) {
    return null;
  }

  return response.menus
    .filter((m) => m.starter.length)
    .map((m) => {
      return [m.starter, ...m.mainCourse, m.dessert];
    });
}
