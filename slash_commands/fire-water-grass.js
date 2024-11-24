const { validBet, calcBetAmount, addBetStatistics } = require("../helpers.js");
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getAmount, addAmount } = require("../database.js");
const { serverIcons } = require("../config.js");

const types = {
  f: 0,
  fire: 0,
  w: 1,
  water: 1,
  g: 2,
  grass: 2,
};

const typeIcons = {
  0: "<:type_feu:1309546684166180956>",
  1: "<:type_eau:1309546619665907753>",
  2: "<:type_plante:1309546759542018068>",
};

const fwg = () => Math.floor(Math.random() * 3);

const winMultiplier = (player, bot) => {
  if (player === bot) return 1;
  if ((player + 1) % 3 === bot) return 0;
  if ((player + 2) % 3 === bot) return 2;
};

module.exports = {
  name: "fire-water-grass",
  aliases: ["fwg", "fgw", "gfw", "gwf", "wfg", "wgf", "fire-water-grass"],
  description:
    "Feu, Eau, Plante (Pierre, Feuille, Ciseaux) et misez vos PokéCoins",
  args: [
    {
      name: "bet-amount",
      type: ApplicationCommandOptionType.String,
      description: "Combien voulez-vous miser ?",
      required: true,
    },
    {
      name: "type",
      type: ApplicationCommandOptionType.String,
      description: "Sur quel type misez-vous ?",
      required: true,
      choices: [
        {
          name: "Feu",
          value: "fire",
        },
        {
          name: "Eau",
          value: "water",
        },
        {
          name: "Plante",
          value: "grass",
        },
      ],
    },
  ],
  guildOnly: true,
  cooldown: 0.5,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  channels: ["casino"],
  execute: async (interaction) => {
    let bet = interaction.options.get("bet-amount").value;
    let type = interaction.options.get("type").value;

    // Check player has selected a type
    if (!type || types[type.toLowerCase()] == undefined) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\Type sélectionné invalide.`);
      return interaction.reply({ embeds: [embed] });
    }
    type = types[type.toLowerCase()];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nMise invalide.`);
      return interaction.reply({ embeds: [embed] });
    }

    const balance = await getAmount(interaction.user);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nPas assez d'argent.`);
      return interaction.reply({ embeds: [embed] });
    }

    // Flip the coin
    const botType = fwg();

    // Calculate winnings
    const multiplier = winMultiplier(type, botType);
    const winnings = Math.floor(bet * multiplier) - bet;

    const output = [
      interaction.user,
      `__**${
        multiplier == 0 ? "PERDU" : multiplier == 1 ? "ÉGALITÉ" : "GAGNÉ"
      }**__`,
      `${typeIcons[type]} _vs_ ${typeIcons[botType]}`,
      `**Gains: ${(winnings + bet).toLocaleString("fr-FR")} ${
        serverIcons.money
      }**`,
    ].join("\n");

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const embed = new EmbedBuilder()
      .setColor(
        multiplier == 0 ? "#e74c3c" : multiplier == 1 ? "#3498db" : "#2ecc71"
      )
      .setDescription(output)
      .setFooter({
        text: `Solde: ${(balance + winnings).toLocaleString("fr-FR")}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
