const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { MINUTE, randomString } = require('../helpers.js');

module.exports = {
  name        : 'custom-color',
  aliases     : [],
  description : 'Change your display color',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const user = interaction.user;
    const member = interaction.member;
    
    const rolesWithColorsAvailable = member.roles.cache.filter(role => member.guild.roles.cache.find(r => r.name == `color-${role.name.toLowerCase().replace(/\s+/g, '-')}`));

    // If no or only 1 role with colors assigned, return
    if (rolesWithColorsAvailable.size <= 1) {
      return interaction.reply({ content: 'No other roles with a color available.', ephemeral: true }).catch(O_o=>{});
    }

    const customID = randomString(6);

    const getButtons = () => {
      const selects = new ActionRowBuilder();
      const select = new StringSelectMenuBuilder()
        .setPlaceholder('Choose a role color')
        .setCustomId(`select-color-${customID}`);

      rolesWithColorsAvailable.sort((a, b) => b.rawPosition - a.rawPosition).forEach(role => {
        const colorRole = member.guild.roles.cache.find(r => r.name == `color-${role.name.toLowerCase().replace(/\s+/g, '-')}`);
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(role.name)
            .setValue(colorRole.name)
            // .setDescription(`Select the ${role.name} color`)
            // .setEmoji((role.emoji?.match(/:(\d+)>/) ?? [role.emoji ?? '879542136549298216'])[1])
            .setDefault(member.roles.cache.has(colorRole.id))
        );
      });
      selects.addComponents(select);
      return selects;
    };

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setDescription([user, 'Select the role color you would like', ''].join('\n'));
    const buttons = getButtons();
    const components = buttons.components.length ? [buttons] : [];
    await interaction.reply({ embeds: [embed], components });

    const role_filter = (i) => i.customId ==`select-color-${customID}` && i.user.id === interaction.user.id;
  
    // Allow reactions for up to x ms
    const time = 2 * MINUTE;
    const role_reaction = interaction.channel.createMessageComponentCollector({ filter: role_filter, time });

    role_reaction.on('collect', async i => {
      await i.deferUpdate();

      // Get the role
      const role = member.guild.roles.cache.find(r => r.name == i.values[0]);

      // Remove other role colors
      const rolesToRemove = member.roles.cache.filter(r => r.name.startsWith('color-'));
      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove.map(r => r.id), 'Applied new role color').catch(O_o=>{});
      }

      // Apply new color
      await member.roles.add(role.id, 'Self applied role color').catch(O_o=>{});
    });

    // Clear all the reactions once we aren't listening
    role_reaction.on('end', () => interaction.editReply({ components: [] }).catch(O_o=>{}));
  },
};
