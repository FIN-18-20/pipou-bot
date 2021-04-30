import { Command } from '../framework';
import Music from '../services/Music';

export default new Command({
  enabled: true,
  name: 'jail',
  description: 'Imprison someone with very gud music.',
  async handle({ message }) {
    const args = message.content.split(/ +/).slice(1);
    const jailDuration = args[1] ? Number(args[1]) * 1000 : 30000;

    if (
      !message.member?.roles.cache.find((r) => r.name === 'Kaelin') &&
      message.guild?.ownerID !== message.author.id
    ) {
      message.reply("You don't have the permission to use this command.");
      return;
    }

    const member = message.mentions.members?.first();
    if (!member) {
      message.reply('You need to mention the member you want to jail.');
      return;
    }

    const oldChannel = member.voice.channel;
    if (!oldChannel) {
      message.channel.send(
        `${member.displayName} needs to be in a voice channel to go in jail!`,
      );
      return;
    }

    // Move to new channel
    const channel = await member.guild.channels.create('jail 💣', {
      type: 'voice',
    });
    member.voice.setChannel(channel);

    // Remove permissions
    const voiceChannels = member.guild.channels.cache.filter(
      (ch) => ch.deleted == false && ch.type === 'voice',
    );
    for (const [, ch] of voiceChannels) {
      ch.overwritePermissions([
        {
          id: member.id,
          deny: ['CONNECT'],
        },
      ]);
    }

    // Start song
    const queue = Music.createQueue(message, channel);
    const song = await Music.getSongInfo(
      'https://www.youtube.com/watch?v=QH2-TGUlwu4',
    );
    queue.songs.push(song);
    queue.connection = await channel.join();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Music.play(message.guild!.id, queue.songs[0]);

    setTimeout(async () => {
      // Reset permissions
      for (const [, ch] of voiceChannels) {
        ch.permissionOverwrites.get(member.id)?.delete();
      }

      // Stop song
      Music.stop(queue);
      if (member.voice.channel) {
        await member.voice.setChannel(oldChannel);
      }
      await channel.delete();
    }, jailDuration);
  },
});
