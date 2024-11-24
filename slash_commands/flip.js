const {
  EmbedBuilder,
  AttachmentBuilder,
  ApplicationCommandOptionType,
} = require("discord.js");
const { getAmount, addAmount } = require("../database.js");
const { validBet, calcBetAmount, addBetStatistics } = require("../helpers.js");
const { serverIcons } = require("../config.js");

const coinSides = {
  heads: 1,
  tails: 0,
};

const coinImage = {
  [coinSides.heads]: "assets/images/currency/flipcoin_heads.png",
  [coinSides.tails]: "assets/images/currency/flipcoin_tails.png",
};

const flipCoin = () => Math.round(Math.random());

module.exports = {
  name: "flip",
  aliases: ["coin"],
  description: "Jouez à pile ou face et misez vos PokéCoins",
  args: [
    {
      name: "bet-amount",
      type: ApplicationCommandOptionType.String,
      description: "Combien voulez-vous miser ?",
      required: true,
    },
    {
      name: "coin-side",
      type: ApplicationCommandOptionType.String,
      description: "Sur quel côté misez-vous ?",
      required: true,
      choices: [
        {
          name: "Face",
          value: "heads",
        },
        {
          name: "Pile",
          value: "tails",
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
    let side = interaction.options.get("coin-side").value;

    // Check player has selected a coin side
    side = coinSides[side.toLowerCase()];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nMise invalide.`, {
          ephemeral: true,
        });
      return interaction.reply({ embeds: [embed] });
    }

    const balance = await getAmount(interaction.user);

    bet = calcBetAmount(bet, balance);

    if (bet > balance || !balance || balance <= 0) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nPas assez d'argent.`, {
          ephemeral: true,
        });
      return interaction.reply({ embeds: [embed] });
    }

    // Flip the coin
    const coinSide = flipCoin();
    const win = coinSide == side;

    // Calculate winnings
    const winnings = Math.floor((bet + bet) * win) - bet;

    const output = [
      interaction.user,
      `**${win ? "GAGNÉ" : "PERDU"}** - ${coinSide ? "FACE" : "PILE"}`,
      `**Gains: ${(winnings + bet).toLocaleString("fr-FR")} ${
        serverIcons.money
      }**`,
    ].join("\n");

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const files = new AttachmentBuilder()
      .setFile(coinImage[coinSide])
      .setName("coin.png");

    const embed = new EmbedBuilder()
      .setColor(win ? "#2ecc71" : "#e74c3c")
      .setThumbnail("attachment://coin.png")
      .setDescription(output)
      .setFooter({
        text: `Solde: ${(balance + winnings).toLocaleString("fr-FR")}`,
      });

    return interaction.reply({ embeds: [embed], files: [files] });
  },
};
