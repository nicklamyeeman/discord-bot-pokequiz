const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getAmount, addAmount } = require("../database.js");
const { validBet, calcBetAmount, addBetStatistics } = require("../helpers.js");
const { serverIcons } = require("../config.js");

const slots = {
  seven: "<:slot_7:1309762878324342894>",
  rocket: "<:slot_r:1309762900067614750>",
  pikachu: "<:slot_pikachu:1309762927745830922>",
  psyduck: "<:slot_psykokwak:1309762952273854524>",
  magnemite: "<:slot_magneti:1309763005055242301>",
  shelder: "<:slot_kokiyas:1309762976756011099>",
  berry: "<:slot_baies:1309763029730066442>",
};

const columnOptions = [
  [slots.seven, 300, 1],
  [slots.rocket, 100, 1],
  [slots.pikachu, 15, 2],
  [slots.psyduck, 15, 2],
  [slots.magnemite, 8, 4],
  [slots.shelder, 8, 4],
  [slots.berry, 1, 1],
];

const columns = [
  [
    slots.pikachu,
    slots.shelder,
    slots.pikachu,
    slots.magnemite,
    slots.seven,
    slots.shelder,
    slots.psyduck,
    slots.rocket,
    slots.berry,
    slots.pikachu,
    slots.shelder,
    slots.seven,
    slots.magnemite,
    slots.pikachu,
    slots.rocket,
    slots.shelder,
    slots.pikachu,
    slots.seven,
    slots.psyduck,
    slots.berry,
    slots.rocket,
  ],
  [
    slots.magnemite,
    slots.berry,
    slots.psyduck,
    slots.pikachu,
    slots.magnemite,
    slots.berry,
    slots.psyduck,
    slots.seven,
    slots.magnemite,
    slots.berry,
    slots.rocket,
    slots.psyduck,
    slots.shelder,
    slots.magnemite,
    slots.psyduck,
    slots.berry,
    slots.seven,
    slots.magnemite,
    slots.berry,
    slots.psyduck,
    slots.rocket,
  ],
  [
    slots.seven,
    slots.psyduck,
    slots.shelder,
    slots.magnemite,
    slots.pikachu,
    slots.psyduck,
    slots.shelder,
    slots.magnemite,
    slots.pikachu,
    slots.psyduck,
    slots.magnemite,
    slots.shelder,
    slots.pikachu,
    slots.psyduck,
    slots.magnemite,
    slots.shelder,
    slots.pikachu,
    slots.psyduck,
    slots.magnemite,
    slots.shelder,
    slots.rocket,
  ],
];

const spinSlots = () => {
  const spinIcons = [[], [], []];
  return spinIcons.map((col, index) => {
    const column = columns[index];
    const rand = Math.floor(Math.random() * column.length);
    return [...column, ...column].slice(rand, rand + 3);
  });
};

const calcWinningsMultiplier = (slotIcons, lines) => {
  let multiplier = 0;

  const row1 = slotIcons.map((r) => r[0]);
  const row2 = slotIcons.map((r) => r[1]);
  const row3 = slotIcons.map((r) => r[2]);

  // Each Row
  if (lines >= 2 && new Set(row1).size == 1)
    multiplier += columnOptions.find((i) => i[0] == row1[0])[1];
  if (new Set(row2).size == 1)
    multiplier += columnOptions.find((i) => i[0] == row2[0])[1];
  if (lines >= 2 && new Set(row3).size == 1)
    multiplier += columnOptions.find((i) => i[0] == row3[0])[1];

  // Both Diagonals
  if (lines >= 3 && new Set([row1[0], row2[1], row3[2]]).size == 1)
    multiplier += columnOptions.find((i) => i[0] == row1[0])[1];
  if (lines >= 3 && new Set([row3[0], row2[1], row1[2]]).size == 1)
    multiplier += columnOptions.find((i) => i[0] == row3[0])[1];

  // Berries
  const berry = slots.berry;
  if (lines >= 2 && row1[0] == berry) {
    if (row1[1] == berry) multiplier += 6;
    else if (lines >= 3 && row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }
  if (row2[0] == berry) {
    if (row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }
  if (lines >= 2 && row3[0] == berry) {
    if (row3[1] == berry) multiplier += 6;
    else if (lines >= 3 && row2[1] == berry) multiplier += 6;
    else multiplier += 2;
  }

  return Math.floor((multiplier / lines) * 100) / 100;
};

module.exports = {
  name: "slots",
  aliases: ["slot"],
  description: "Faites tourner la machine à sous et misez vos PokéCoins",
  helpFields: [
    [
      "❯ Lines:",
      [
        "**`1 Line:`** Ligne horizontale du milieu",
        "**`2 Lines:`** Les 3 linges horizontales",
        "**`3 Lines:`** Les 3 lignes horizontales et les deux diagonales _(default)_",
      ].join("\n"),
    ],
    [
      "❯ Multipliers:",
      [
        `${columnOptions
          .filter(([icon, multiplier]) => multiplier > 1)
          .map(
            ([icon, multiplier]) =>
              `${icon}${icon}${icon} ║ **× ${multiplier}**`
          )
          .join("\n")}`,
        `${slots.berry}${slots.berry}➖ ║ **× 6**`,
        `${slots.berry}➖➖ ║ **× 2**`,
        "",
        "_**Note:** Le multiplicateur est divisé par le nombre de lignes que vous jouez._",
      ].join("\n"),
    ],
  ],
  args: [
    {
      name: "bet-amount",
      type: ApplicationCommandOptionType.String,
      description: "Combien voulez-vous miser ?",
      required: true,
    },
    {
      name: "lines",
      type: ApplicationCommandOptionType.Integer,
      description: "Sur combien de lignes voulez-vous jouer ? (par défaut 3)",
      required: false,
      choices: [
        {
          name: "1",
          value: 1,
        },
        {
          name: "2",
          value: 2,
        },
        {
          name: "3",
          value: 3,
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
    let [bet, lines] = [
      interaction.options.get("bet-amount").value,
      interaction.options.get("lines")?.value || 3,
    ];

    // Check the bet amount is correct
    if (!validBet(bet)) {
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setDescription(`${interaction.user}\nMise invalide.`);
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

    // Check the player has entered a correct amount of lines
    if (!lines || isNaN(lines) || lines > 3 || lines < 1) lines = 3;

    const slotIcons = spinSlots();

    const multiplier = calcWinningsMultiplier(slotIcons, lines);
    const winnings = Math.floor(bet * multiplier) - bet;

    const output = [
      interaction.user,
      "",
      `║ ${slotIcons.map((r) => r[0]).join(" ║ ")} ║`,
      `║ ${slotIcons.map((r) => r[1]).join(" ║ ")} ║`,
      `║ ${slotIcons.map((r) => r[2]).join(" ║ ")} ║`,
      "",
      `**Gains: ${(winnings + bet).toLocaleString("fr-FR")} ${
        serverIcons.money
      }**`,
    ];

    addAmount(interaction.user, winnings);
    addBetStatistics(interaction.user, bet, winnings);

    const embed = new EmbedBuilder()
      .setColor(multiplier >= 1 ? "#2ecc71" : "#e74c3c")
      .setDescription(output.join("\n"))
      .setFooter({
        text: `Solde: ${(balance + winnings).toLocaleString("fr-FR")}`,
      });
    return interaction.reply({ embeds: [embed] });
  },
};
