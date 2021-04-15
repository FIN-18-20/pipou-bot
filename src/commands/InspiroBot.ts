import got from 'got';
import { Command, sleep } from '../framework';
import Store from '../services/Store';
import { MessageEmbed, TextChannel } from 'discord.js';

interface QuoteData {
  type: string;
  time: number;
  duration?: number;
  text?: string;
  image?: string;
}

interface MindfulnessMode {
  data: Array<QuoteData>;
  mp3: string;
}

export default new Command({
  enabled: true,
  name: 'inspirobot',
  alias: ['inspire', 'ib', 'inspiro'],
  description:
    'Get an unique inspirational quote for endless enrichment of pointless human existence.',
  async handle({ message }) {
    const args = message.content.split(' ').slice(1);

    const mindfulnessModeArgs = ['mm', 'mindfulnessmode', 'mindfulness-mode'];

    const hooks = await (message.channel as TextChannel).fetchWebhooks();
    const inspirobotHook =
      hooks.get('Inspirobot') ??
      (await (message.channel as TextChannel).createWebhook('Inspirobot', {
        avatar: 'https://inspirobot.me/website/images/favicon.png',
      }));

    if (args.length === 1) {
      if (!message.member || !message.client.user || !message.guild) return;
      const queueId = message.guild.id + message.channel.id;

      if (mindfulnessModeArgs.includes(args[0])) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
          message.channel.send(
            'You need to be in a voice channel to use mindfulness mode!',
          );
          return;
        }

        Store.inspiroBotQueues.set(queueId, true);

        const { body: sessionID } = await got.get('https://inspirobot.me/api', {
          searchParams: { getSessionID: 1 },
        });
        const connection = await voiceChannel.join();

        do {
          if (connection.dispatcher) {
            connection.dispatcher.pause();
          }

          const response: MindfulnessMode = await got
            .get('https://inspirobot.me/api', {
              searchParams: {
                generateFlow: 1,
                sessionID: sessionID,
              },
            })
            .json();

          const musicURL = response.mp3;
          connection.play(musicURL, { volume: false });

          const pauseRegex = new RegExp(/\[pause \d\]/, 'g');

          let currentTime = 0;
          for (let i = 0; i < response.data.length - 1; i++) {
            if (response.data[i].type === 'quote') {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              response.data[i].text = response.data[i].text!.replace(
                pauseRegex,
                '',
              );
              try {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const msg = await inspirobotHook.send(response.data[i].text!);
                await sleep((response.data[i + 1].time - currentTime) * 1000);
                msg.delete({ timeout: 2000 });
              } catch (e) {
                console.error(e);
              }
            } else if (response.data[i].type === 'transition') {
              await sleep((response.data[i + 1].time - currentTime) * 1000);
            }
            currentTime = response.data[i + 1].time;

            if (!Store.inspiroBotQueues.get(queueId)) break;
          }
        } while (Store.inspiroBotQueues.get(queueId));

        voiceChannel.leave();
        Store.inspiroBotQueues.delete(queueId);
      } else if (args[0] === 'stop') {
        if (!message.member || !message.client.user || !message.guild) return;

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
          message.channel.send(
            'You need to be in a voice channel to use mindfulness mode!',
          );
          return;
        }

        Store.inspiroBotQueues.set(queueId, false);
      }
    } else {
      const { body: url } = await got.get(
        'https://inspirobot.me/api?generate=true',
      );
      const embed = new MessageEmbed()
        .setURL(url)
        .setTitle('InspiroBot says :')
        .setImage(url);

      try {
        inspirobotHook.send(embed).catch(console.error);
      } catch (e) {
        console.error(e);
      }
    }
  },
});
