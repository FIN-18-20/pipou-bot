import { Command } from '../framework';
import got from 'got';
import { MessageEmbed, EmbedFieldData } from 'discord.js';

interface MultiSearchResult {
  id: number,
  media_type: string,
  title: string | null,
  name: string | null,
  overview: string | null,
  poster_path: string | null,
  backdrop_path: string | null
}

interface MultiSearch {
  page: number,
  results: Array<MultiSearchResult>,
  total_results: number,
  total_pages: number
}

interface Provider {
  provider_name: string
}

interface ProvidersByCountry {
  link: string,
  rent: Array<Provider>,
  flatrate: Array<Provider>,
  buy: Array<Provider>
}

interface ProviderSearchResult {
  [key: string]: ProvidersByCountry
}

interface ProviderSearch {
  id: number,
  results: ProviderSearchResult
}

async function getProviders(media: string, id: number): Promise<ProviderSearchResult> {
  const providersData: ProviderSearch = await got
    .get(`https://api.movie-park.ch/api/${media}/${id}/watch/providers?api_key=APIKEY`)
    .json();

  const providersResults: ProviderSearchResult = {};
  for (const key in providersData.results) {
    if (key === 'CH' || key === 'US') {
      providersResults[key] = providersData.results[key]
    }
  }
  return providersResults;
}

function addFields(countryProvider: ProvidersByCountry, emoji: string): EmbedFieldData[] {
  const embedFields: EmbedFieldData[] = []
  embedFields.push({ name: '\u200b', value: `[${emoji} Providers](${countryProvider.link})`, inline: false });

  let streaming = ''
  let rent = ''
  let buy = ''

  if (countryProvider.flatrate !== undefined) {
    for (const provider of countryProvider.flatrate) {
      streaming += provider.provider_name + '\n';
    }
    embedFields.push({ name: 'Streaming', value: streaming, inline: true, })
  }

  if (countryProvider.rent !== undefined) {
    for (const provider of countryProvider.rent) {
      rent += provider.provider_name + '\n';
    }
    embedFields.push({ name: 'Rent', value: rent, inline: true, })
  }

  if (countryProvider.buy !== undefined) {
    for (const provider of countryProvider.buy) {
      buy += provider.provider_name + '\n';
    }
    embedFields.push({ name: 'Buy', value: buy, inline: true, })
  }

  return embedFields;
}

export default new Command({
  enabled: true,
  name: 'watch-providers',
  alias: ['watch'],
  description: 'Get streaming providers for a TV show/movie provided by Moviepark.',
  async handle({ message }) {
    const args = message.content.split(' ').slice(1);

    if (!args.length) {
      message.channel.send(
        "Invalid arguments. Try again.",
      );
      return;
    }
    const query = args.join(' ');

    const data: MultiSearch = await got
      .get(`https://api.movie-park.ch/api/search/multi?api_key=APIKEY&language=en-US&query=${query}&page=1&include_adult=false`)
      .json();

    if (data.total_results === 0 || data.results[0].media_type === "person") {
      message.channel.send(
        "No result for: " + query,
      );
      return;
    }

    const dataResut: MultiSearchResult = data.results[0];
    const title = dataResut.title === undefined ? dataResut.name : dataResut.title;
    const providersResults = await getProviders(dataResut.media_type, dataResut.id);

    if (!Object.keys(providersResults).length) {
      message.channel.send(
        "No result for: " + query,
      );
      return;
    }

    const chProvider: ProvidersByCountry | null = providersResults['CH'] ?? null;
    const usProvider: ProvidersByCountry | null = providersResults['US'] ?? null;

    const embedFields: EmbedFieldData[] = [];

    if (chProvider) {
      embedFields.push(...addFields(chProvider, '🇨🇭'));
    }
    if (usProvider) {
      embedFields.push(...addFields(usProvider, '🇺🇸'));
    }
    const embed = new MessageEmbed()
      .setColor('#d70745')
      .setAuthor(
        'Movie-park.ch',
        'https://movie-park.ch/_nuxt/icons/icon_64x64.1d1277.png',
        'https://movie-park.ch',
      )
      .setTitle(title)
      .setThumbnail(`https://image.tmdb.org/t/p/w154/${dataResut.poster_path}`)
      .addFields(...embedFields)
      .setFooter('Powered by Moviepark, TMDB & JustWatch')
    message.channel.send(embed);
  },
});
