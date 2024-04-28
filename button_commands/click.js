const { EmbedBuilder } = require('discord.js');
const { addStatistic, getOverallStatistic } = require('../database.js');

module.exports = {
  name        : 'click',
  aliases     : [],
  description : 'Click the button',
  args        : [],
  guildOnly   : true,
  cooldown    : 30,
  botperms    : ['SendMessages', 'EmbedLinks'],
  userperms   : [],
  channels    : ['claims'],
  execute     : async (interaction) => {
    addStatistic(interaction.user, 'clicks');

    interaction.reply({
      embeds: [new EmbedBuilder().setColor('#2ecc71').setDescription('+1 click')],
      ephemeral: true,
    });

    // Update the bot message with the new claim amount
    const totalClicks = await getOverallStatistic('clicks');
    const mainEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    mainEmbed.setDescription(mainEmbed.toJSON().description.replace(/clicks: .*/i, `clicks: \`${totalClicks.value.toLocaleString()}\``));
    interaction.message.edit({ embeds: [mainEmbed] });
  },
};
