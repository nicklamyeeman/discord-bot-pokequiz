const { EmbedBuilder } = require('discord.js');
const { addStatistic, getOverallStatistic } = require('../database.js');
const { SECOND } = require('../helpers/constants.js');

// Cool down in seconds
const cooldown = 30;

module.exports = {
  name        : 'click',
  aliases     : [],
  description : 'Click the button',
  args        : [],
  guildOnly   : true,
  cooldown    : cooldown,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['claims'],
  execute     : async (interaction) => {
    const clicks = await addStatistic(interaction.user, 'clicks');

    interaction.reply({
      embeds: [
        new EmbedBuilder().setColor('#2ecc71').setDescription(
          `**+1 click 🖱️**

*next click: <t:${Math.round((Date.now() + (SECOND * 30)) / 1000)}:R>*
${clicks % 100 === 0 ? `\n🎉 **You have contributed ${clicks.toLocaleString()} clicks!** 🎉` : ''}`
        ),
      ],
      ephemeral: true,
    }).then(m => {
      // Try delete the message once they can click again
      try {
        setTimeout(() => m.delete(), cooldown * SECOND);
      } catch (e) {}
    });

    // Update the bot message with the new claim amount
    const totalClicks = await getOverallStatistic('clicks');
    const mainEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    mainEmbed.setDescription(mainEmbed.toJSON().description.replace(/clicks: .*/i, `clicks: \`${totalClicks.value.toLocaleString()}\``));
    interaction.message.edit({ embeds: [mainEmbed] });
  },
};
