const { EmbedBuilder } = require("discord.js");
const { trainerCardBadges } = require("../helpers.js");

module.exports = {
  name: "badges",
  aliases: [],
  description:
    "Vérifiez quels badges peuvent être obtenus pour votre carte dresseur.",
  args: [],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    const embed = new EmbedBuilder()
      .setDescription(
        trainerCardBadges
          .map((b) => `**${b.icon} ${b.name} Badge:**\n_${b.description}_`)
          .join("\n")
      )
      .setColor("#3498db");
    return interaction.reply({ embeds: [embed] });
  },
};
