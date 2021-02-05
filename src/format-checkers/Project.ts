import { FormatChecker } from '../framework';

const urlRegexp =
  'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)';
const projectsRegexp = `^\\*\\*(\\w ?)+\\*\\*\\n\\n(.*\\n)+\n${urlRegexp}$`;

export default new FormatChecker({
  enabled: true,
  name: 'Project',
  description: 'Force le formatage du channel #projets.',
  channelName: 'projets',
  checker: new RegExp(projectsRegexp),
  examples: [
    `**Nom du projet**\n\nDescription du projet\n\nhttps://github.com`,
  ],
});
