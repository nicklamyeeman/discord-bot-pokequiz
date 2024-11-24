const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getAmount, addAmount } = require("../database.js");
const { validBet, calcBetAmount, addBetStatistics } = require("../helpers.js");
const { serverIcons } = require("../config.js");

const multipliers = [1.5, 1.7, 2.4, 0.2, 1.2, 0.1, 0.3, 0.5];
const arrows = ["↖️", "⬆️", "↗️", "⬅️", "➡️", "↙️", "⬇️", "↘️"];

const getMultiplier = () =>
  multipliers[Math.floor(Math.random() * multipliers.length)];
const getArrow = (multiplier) =>
  arrows[multipliers.findIndex((m) => m == multiplier)];

module.exports = {
  name: "spin",
  aliases: ["wheel"],
  description: "Tournez la roue et misez vos PokéCoins",
  args: [
    {
      name: "bet-amount",
      type: ApplicationCommandOptionType.String,
      description: "Combien voulez-vous miser ?",
      required: true,
    },
  ],
  guildOnly: true,
  cooldown: 0.5,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  channels: ["casino"],
  execute: async (interaction) => {
    let bet = interaction.options.get("bet-amount").value;

    // Check the bet amount is correct
    if (!validBet(bet) || bet < 10) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(
          `${interaction.user}\nMise invalide, la mise doit être supérieure ou égale à 10.`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const balance = await getAmount(interaction.user);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nPas assez d'argent.`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const multiplier = getMultiplier();
    const arrow = getArrow(multiplier);
    const winnings = Math.floor(bet * multiplier) - bet;

    const output = [
      interaction.user,
      `**Gains: ${(winnings + bet).toLocaleString("fr-FR")} ${
        serverIcons.money
      }**`,
      "",
      `\`${multipliers
        .slice(0, 3)
        .map((i) => `[${i}]`)
        .join("")}\``,
      `\`[${multipliers[3]}]\` ${arrow} \`[${multipliers[4]}]\``,
      `\`${multipliers
        .slice(5, 8)
        .map((i) => `[${i}]`)
        .join("")}\``,
    ];

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const embed = new EmbedBuilder()
      .setColor(multiplier > 1 ? "#2ecc71" : "#e74c3c")
      .setDescription(output.join("\n"))
      .setFooter({
        text: `Solde: ${(balance + winnings).toLocaleString("fr-FR")}`,
      });
    return interaction.reply({ embeds: [embed] });
  },
};
