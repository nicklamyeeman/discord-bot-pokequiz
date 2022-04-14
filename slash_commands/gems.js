const { MessageEmbed } = require('discord.js');
const {
  PokemonType,
  GameConstants,
  pokemonTypeIcons,
  RouteGemTypes,
  findGemRoutes,
  findGemBestRoute,
  gameVersion,
} = require('../helpers.js');

module.exports = {
  name        : 'gems',
  aliases     : ['gem', 's', 'shard'],
  description : 'Get a list of routes where you can obtain a particular type of gem',
  args        : [
    {
      name: 'type',
      type: 'STRING',
      description: 'Gem type',
      required: true,
      choices: [
        {
          name: 'Normal',
          value: 'Normal',
        },
        {
          name: 'Fire',
          value: 'Fire',
        },
        {
          name: 'Water',
          value: 'Water',
        },
        {
          name: 'Electric',
          value: 'Electric',
        },
        {
          name: 'Grass',
          value: 'Grass',
        },
        {
          name: 'Ice',
          value: 'Ice',
        },
        {
          name: 'Fighting',
          value: 'Fighting',
        },
        {
          name: 'Poison',
          value: 'Poison',
        },
        {
          name: 'Ground',
          value: 'Ground',
        },
        {
          name: 'Flying',
          value: 'Flying',
        },
        {
          name: 'Psychic',
          value: 'Psychic',
        },
        {
          name: 'Bug',
          value: 'Bug',
        },
        {
          name: 'Rock',
          value: 'Rock',
        },
        {
          name: 'Ghost',
          value: 'Ghost',
        },
        {
          name: 'Dragon',
          value: 'Dragon',
        },
        {
          name: 'Dark',
          value: 'Dark',
        },
        {
          name: 'Steel',
          value: 'Steel',
        },
        {
          name: 'Fairy',
          value: 'Fairy',
        },
      ],
    },
    {
      name: 'order',
      type: 'STRING',
      description: 'Order by',
      required: false,
      choices: [
        {
          name: 'Chance',
          value: 'chance',
        },
        {
          name: 'Route',
          value: 'route',
        },
      ],
    },
  ],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const [
      type,
      order,
    ] = [
      interaction.options.get('type').value,
      interaction.options.get('order')?.value || 'chance',
    ];
    
    const sortFunc = order == 'chance' ? (a, b) => b[1] - a[1] : (a, b) => a[0] - b[0];

    const embed = new MessageEmbed()
      .setTitle(`${pokemonTypeIcons[type]} ${type} Gem Routes`)
      .setColor('#3498db')
      .setFooter({ text: `Data is up to date as of v${gameVersion}` });

    const gemRoutes = findGemRoutes(RouteGemTypes, PokemonType[type]);
    Object.entries(gemRoutes).forEach(([region, routes]) => {
      if (!Object.entries(routes).length) return;
      const bestGemRoute = findGemBestRoute(RouteGemTypes, PokemonType[type], region);
      const description = ['Best Route:', `${`[${bestGemRoute.route}]`.padEnd(4, ' ')} ${bestGemRoute.chance.toFixed(1).padStart(4,' ')}%`, '\nAll Routes:'];
      
      Object.entries(routes).sort(sortFunc).forEach(([route, chance]) => {
        description.push(`${`[${route}]`.padEnd(4, ' ')} ${chance.toFixed(1).padStart(4,' ')}%`);
      });
      embed.addField(`❯ ${GameConstants.Region[region].toUpperCase()}`, `\`\`\`ini\n${description.join('\n')}\n\`\`\``, true);
    });

    interaction.reply({ embeds: [embed] });
  },
};