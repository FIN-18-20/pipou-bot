import { Client, MessageEmbed, TextChannel } from 'discord.js';

export function findTextChannelByName(
  client: Client,
  name: string,
): TextChannel | undefined {
  return client.channels.cache.find(
    (channel) => channel instanceof TextChannel && channel.name === name,
  ) as TextChannel | undefined;
}

export function secToTime(sec: number): string {
  let hour = 0;
  let min = Math.floor(sec / 60);
  if (min > 59) {
    hour = Math.floor(min / 60);
    min %= 60;
  }

  if (hour == 0) {
    const newSec: number = Math.floor(sec - min * 60);
    const newSecStr = newSec < 10 ? '0' + newSec : newSec;
    return `${min}:${newSecStr}`;
  }

  const minStr = min < 10 ? '0' + min : min;
  return `${hour}h${minStr}`;
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

export function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ErrorEmbed(message: string): MessageEmbed {
  return new MessageEmbed().setColor('#DC2626').addFields({
    name: '❌  Error',
    value: message,
  });
}

export function isNumber(value: unknown): boolean {
  return (
    (typeof value === 'number' && !isNaN(value)) ||
    (typeof value === 'string' && value.trim() != '' && !isNaN(Number(value)))
  );
}

export function splitArray<T>(array: Array<T>, size: number): Array<Array<T>> {
  const arrayOfArrays = [];
  for (let i = 0; i < array.length; i += size)
    arrayOfArrays.push(array.slice(i, i + size));
  return arrayOfArrays;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
