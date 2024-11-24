const { EmbedBuilder } = require("discord.js");
const { getAmount } = require("../database.js");
const { serverIcons } = require("../config.js");

module.exports = {
  name: "balance",
  aliases: ["bal", "$"],
  description: "Obtenez votre solde actuel de PokéCoins",
  args: [],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    const balance = await getAmount(interaction.user);

    const output = [
      interaction.user,
      `**Solde: ${balance.toLocaleString("fr-FR")} ${serverIcons.money}**`,
    ].join("\n");

    const embed = new EmbedBuilder().setColor("#3498db").setDescription(output);

    return interaction.reply({ embeds: [embed] });
  },
};
