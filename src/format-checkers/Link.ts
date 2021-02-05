import { FormatChecker } from '../framework';
import createRegExp from 'emoji-regex';

const textRegexp = '\\*\\*[A-Z]+\\*\\*';
// todo: limiter aux emojis disponibles sur le serveur
const discordEmojiRegexp = ' ?<:[a-z]+:[0-9]+> ?';
const unicodeEmojiRegexp = ` ?${createRegExp().source} ?`;
const urlRegexp =
  'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)';
const descriptionRegexp = '([^\\r\\n])+ ';
const linkRegexp = `^\\[((${textRegexp})|(${discordEmojiRegexp})|${unicodeEmojiRegexp})\\]${descriptionRegexp}- ${urlRegexp}$`;

export default new FormatChecker({
  enabled: true,
  name: 'Link',
  description: 'Force le formatage du channel #liens.',
  channelName: 'liens',
  checker: new RegExp(linkRegexp),
  examples: [
    '[**SUJET**] Votre description ici - https://github.com/es-community',
    '[👍] Votre description ici - https://github.com/es-community',
  ],
});
