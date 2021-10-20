import { MessageEmbed } from 'discord.js';
import got from 'got';

import { Cron, findTextChannelByName } from '../framework';

export default new Cron({
  enabled: true,
  name: 'Menu',
  description:
    'Check each day the lunch menu and post it in the #blabla channel.',
  schedule: '*/1 * * * *',
  async handle(context) {
    const menu = await getTodayMenu();
    // if (!latestCommitStrip) {
    //   return;
    // }
    // context.logger.info(`Found a new CommitStrip (${latestCommitStrip.id})`);

    // const channel = findTextChannelByName(context.client, 'gif');
    // if (!channel) {
    //   throw new Error('found no #gif channel');
    // }

    // await channel.send(
    //   `${latestCommitStrip.title} - ${latestCommitStrip.link}`,
    //   new MessageEmbed({ image: { url: latestCommitStrip.imageUrl } }),
    // );
  },
});

interface MenuAPIResponse {
  date: string;
  menus: Array<Menu>;
}

interface Menu {
  starter: string;
  mainCourse: Array<string>;
  dessert: string;
  containsPork: boolean;
}

async function getTodayMenu(): Promise<MenuAPIResponse | null> {
  const { body: response } = await got<MenuAPIResponse>(
    'https://apix.blacktree.io/top-chef/today',
    { responseType: 'json' },
  );

  console.log(response);
  return null;

  // if (posts.length === 0) {
  //   return null;
  // }

  // const [strip] = posts;

  // const stripDate = new Date(strip.date);
  // const stripTime = stripDate.getTime();
  // const nowTime = now.getTime();
  // const thirtyMinutes = 1000 * 60 * 30;

  // if (nowTime - stripTime > thirtyMinutes) {
  //   // Ignore if the strip was not posted in the last 30 minutes
  //   return null;
  // }

  // const stripImageUrlReg = /src="([^"]+)"/;
  // const urlMatch = stripImageUrlReg.exec(strip.content.rendered);
  // if (!urlMatch) {
  //   return null;
  // }

  // return {
  //   id: strip.id,
  //   date: stripDate,
  //   link: strip.link,
  //   title: strip.title.rendered,
  //   imageUrl: urlMatch[1],
  // };
}
