import { Command } from '../framework';
import got from 'got';
import { MessageEmbed, EmbedFieldData } from 'discord.js';

interface MultiSearchResult {
  id: number,
  media_type: string,
}

interface DetailedSearchResult {
  title: string | null,
  name: string | null,
  overview: string | null,
  poster_path: string | null,
  backdrop_path: string | null,
  videos: VideosSearch,
  'watch/providers': ProviderSearch
}

interface MultiSearch {
  page: number,
  results: Array<MultiSearchResult>,
  total_results: number,
  total_pages: number
}

interface VideosSearch {
  results: Array<Video>
}
interface Video {
  name: string,
  key: string,
  type: string,
  site: string
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
  results: ProviderSearchResult
}

function getProviders(providers: ProviderSearch): ProviderSearchResult {
  const providersResults: ProviderSearchResult = {};
  if (Object.keys(providers).length === 0) {
    return providersResults;
  }

  for (const key in providers.results) {
    if (key === 'CH' || key === 'US') {
      providersResults[key] = providers.results[key]
    }
  }
  return providersResults;
}

function getVideo(videos: Array<Video>): Video | null {
  
  if (videos.length === 0) {
    return null;
  }
  const video = videos.find(video => video.type === "Trailer" || video.type === "Teaser" && video.site === "YouTube");
  return video === undefined ? null : video;
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
      .get(`https://api.movie-park.ch/search/multi?api_key=APIKEY&language=en-US&query=${query}&page=1&include_adult=false`)
      .json();

    if (data.total_results === 0 || data.results[0].media_type === "person") {
      message.channel.send(
        "No result for: " + query,
      );
      return;
    }

    const dataResut: MultiSearchResult = data.results[0];
    const detailedData : DetailedSearchResult = await got
      .get(`https://api.movie-park.ch/${dataResut.media_type}/${dataResut.id}?api_key=APIKEY&append_to_response=videos,watch/providers`)
      .json();
    
    const title = detailedData.title === undefined ? detailedData.name : detailedData.title;

    const providersResults = getProviders(detailedData['watch/providers']);

    const embedFields: EmbedFieldData[] = [];

    if (detailedData.overview) {
      embedFields.push({ name: "Overview", value: detailedData.overview, inline: false});
    }

    const video = getVideo(detailedData.videos.results);

    if (video) {
      embedFields.push({ name: `${video.type}`, value: `[${video.name}](https://youtube.com/watch?v=${video.key})`, inline: true});
    }

    if (Object.keys(providersResults).length) {
      const chProvider: ProvidersByCountry | null = providersResults['CH'] ?? null;
      const usProvider: ProvidersByCountry | null = providersResults['US'] ?? null;

      if (chProvider) {
        embedFields.push(...addFields(chProvider, '🇨🇭'));
      }
      if (usProvider) {
        embedFields.push(...addFields(usProvider, '🇺🇸'));
      }
    }
    const posterURL = detailedData.poster_path
                      ? `https://image.tmdb.org/t/p/w500/${detailedData.poster_path}` 
                      : "https://via.placeholder.com/300x400.jpg/d70745/000000%20?text=No+Image";
    const backdropURL = detailedData.backdrop_path
                      ? `https://image.tmdb.org/t/p/w780/${detailedData.backdrop_path}` 
                      : "https://via.placeholder.com/780x400.jpg/d70745/000000%20?text=No+Image";
    const embed = new MessageEmbed()
      .setColor('#d70745')
      // .setAuthor('Movie-park.ch') will be added when website is up again
      .setTitle(title)
      .setThumbnail(posterURL)
      .addFields(...embedFields)
      .setImage(backdropURL)
      .setFooter('Powered by Moviepark, TMDB & JustWatch')
    message.channel.send(embed);
  },
});
