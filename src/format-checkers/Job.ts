import { FormatChecker } from '../framework';

export default new FormatChecker({
  enabled: true,
  name: 'Job',
  description: 'Force le formatage du channel #jobs.',
  channelName: 'jobs',
  checker: (message, logger) => {
    const lines = message.split('\n');
    const headerParts = lines[0].split(' - ');

    const predicates = [
      lines.length >= 2,
      lines[0].startsWith('**') && lines[0].endsWith('**'),
      headerParts.length === 3,
    ];

    logger.trace(predicates, 'predicates failed');
    return !predicates.includes(false);
  },
  examples: [
    [
      '**[ Orientation du poste ] - [ langage/techno (si possible avec les émoji) ] - Intitulé du poste**',
      'Description rapide (missions proposés, lieu, nom de la boite, rémunération...)',
      "Lien de l'annonce / Contact",
    ].join('\n'),
  ],
});
