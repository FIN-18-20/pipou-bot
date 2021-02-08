import { Client, TextChannel } from 'discord.js';

export function findTextChannelByName(
  client: Client,
  name: string,
): TextChannel | undefined {
  return client.channels.cache.find(
    (channel) => channel instanceof TextChannel && channel.name === name,
  ) as TextChannel | undefined;
}

export function shuffle<T>(array: Array<T>): Array<T> {
  let counter = array.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}
