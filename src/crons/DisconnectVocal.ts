import { Cron } from '../framework';
import Music from '../services/Music';
import Store from '../services/Store';

export default new Cron({
  enabled: true,
  name: 'DisconnectVocal',
  description:
    'Check every minute if a bot instance is alone in a vocal channel to disconnect it.',
  schedule: '*/1 * * * *',
  async handle() {
    const servers = Array.from(Store.musicQueues.values());
    if (!servers.length) return;

    for (const server of servers) {
      if (server.voiceChannel.members.size == 1) {
        Music.stop(server);
        server.voiceChannel.leave();
        Store.musicQueues.delete(server.guild);
      }
    }
  },
});
