import { MessageEmbed } from 'discord.js';
import got from 'got';

import { Cron, findTextChannelByName } from '../framework';

export default new Cron({
  enabled: false,
  name: 'CommitStrip',
  description:
    'Vérifie toutes les 30 minutes si un nouveau CommitStrip est sorti et le poste dans #gif',
  schedule: '*/30 * * * *',
  async handle(context) {
    const latestCommitStrip = await getRecentCommitStrip(context.date);
    if (!latestCommitStrip) {
      return;
    }
    context.logger.info(`Found a new CommitStrip (${latestCommitStrip.id})`);

    const channel = findTextChannelByName(context.client, 'gif');
    if (!channel) {
      throw new Error('found no #gif channel');
    }

    await channel.send(
      `${latestCommitStrip.title} - ${latestCommitStrip.link}`,
      new MessageEmbed({ image: { url: latestCommitStrip.imageUrl } }),
    );
  },
});

/**
 * Subset of the fields returned by the WordPress Posts API.
 */
interface WordPressPost {
  id: number;
  date: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
}

/**
 * Strip information extracted from the WordPress post.
 */
interface CommitStrip {
  /**
   * Post ID.
   */
  id: number;
  /**
   * Post date.
   */
  date: Date;
  /**
   * Direct link to the post.
   */
  link: string;
  /**
   * Post title.
   */
  title: string;
  /**
   * URL of the strip image.
   */
  imageUrl: string;
}

/**
 * Fetches the most recent post from the WordPress API. If there is one and it
 * was posted between the previous and current cron execution, returns it.
 * Otherwise, or if the post does not contain any image URL, returns null.
 * @param now - Current date. Comes from cron schedule.
 */
async function getRecentCommitStrip(now: Date): Promise<CommitStrip | null> {
  const { body: posts } = await got<WordPressPost[]>(
    'https://www.commitstrip.com/fr/wp-json/wp/v2/posts?per_page=1',
    { responseType: 'json' },
  );

  if (posts.length === 0) {
    return null;
  }

  const [strip] = posts;

  const stripDate = new Date(strip.date);
  const stripTime = stripDate.getTime();
  const nowTime = now.getTime();
  const thirtyMinutes = 1000 * 60 * 30;

  if (nowTime - stripTime > thirtyMinutes) {
    // Ignore if the strip was not posted in the last 30 minutes
    return null;
  }

  const stripImageUrlReg = /src="([^"]+)"/;
  const urlMatch = stripImageUrlReg.exec(strip.content.rendered);
  if (!urlMatch) {
    return null;
  }

  return {
    id: strip.id,
    date: stripDate,
    link: strip.link,
    title: strip.title.rendered,
    imageUrl: urlMatch[1],
  };
}
