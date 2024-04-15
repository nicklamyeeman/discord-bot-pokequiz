const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { MINUTE, randomString } = require('../helpers.js');

module.exports = {
  name        : 'custom-icon',
  aliases     : [],
  description : 'Change your displayed role icon',
  args        : [],
  guildOnly   : true,
  cooldown    : 3,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['bot-commands'],
  execute     : async (interaction) => {
    const user = interaction.user;
    const member = interaction.member;
    
    const rolesWithIconsAvailable = member.roles.cache.filter(role => member.guild.roles.cache.find(r => r.name == `icon-${role.name.toLowerCase().replace(/\s+/g, '-')}`));

    // If no or only 1 role with icons assigned, return
    if (rolesWithIconsAvailable.size <= 1) {
      return interaction.reply({ content: 'No other roles with an icon available.', ephemeral: true }).catch(O_o=>{});
    }

    const customID = randomString(6);

    const getButtons = () => {
      const selects = new ActionRowBuilder();
      const select = new StringSelectMenuBuilder()
        .setPlaceholder('Choose a role icon')
        .setCustomId(`select-icon-${customID}`);

      rolesWithIconsAvailable.sort((a, b) => b.rawPosition - a.rawPosition).forEach(role => {
        const iconRole = member.guild.roles.cache.find(r => r.name == `icon-${role.name.toLowerCase().replace(/\s+/g, '-')}`);
        select.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(role.name)
            .setValue(iconRole.name)
            // .setDescription(`Select the ${role.name} color`)
            // .setEmoji((role.emoji?.match(/:(\d+)>/) ?? [role.emoji ?? '879542136549298216'])[1])
            .setDefault(member.roles.cache.has(iconRole.id))
        );
      });
      selects.addComponents(select);
      return selects;
    };

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setDescription([user, 'Select the role icon you would like', ''].join('\n'));
    const buttons = getButtons();
    const components = buttons.components.length ? [buttons] : [];
    await interaction.reply({ embeds: [embed], components });

    const role_filter = (i) => i.customId == `select-icon-${customID}` && i.user.id === interaction.user.id;
  
    // Allow reactions for up to x ms
    const time = 2 * MINUTE;
    const role_reaction = interaction.channel.createMessageComponentCollector({ filter: role_filter, time });

    role_reaction.on('collect', async i => {
      await i.deferUpdate();

      // Get the role
      const role = member.guild.roles.cache.find(r => r.name == i.values[0]);

      // Remove other role colors
      const rolesToRemove = member.roles.cache.filter(r => r.name.startsWith('icon-'));
      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove.map(r => r.id), 'Applied new role icon').catch(O_o=>{});
      }

      // Apply new color
      if (role) {
        await member.roles.add(role.id, 'Self applied role icon').catch(O_o=>{});
      }
    });

    // Clear all the reactions once we aren't listening
    role_reaction.on('end', () => interaction.editReply({ components: [] }).catch(O_o=>{}));
  },
};
