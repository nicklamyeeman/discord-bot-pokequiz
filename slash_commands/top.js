const { ApplicationCommandOptionType } = require("discord.js");
const { getTop } = require("../database.js");
const { postPages } = require("../helpers.js");
const { serverIcons } = require("../config.js");

module.exports = {
  name: "top",
  aliases: ["leaderboard", "lb"],
  description:
    "Obtenir la liste des utilisateurs ayant le plus de points dans des catégories spécifiques",
  args: [
    {
      name: "type",
      type: ApplicationCommandOptionType.String,
      description: "Combien de lignes à afficher ? (par défaut 3)",
      required: false,
      choices: [
        {
          name: "Réponses",
          value: "answers",
        },
        {
          name: "Quiz",
          value: "answers",
        },
        {
          name: "Messages",
          value: "messages",
        },
        {
          name: "Commandes",
          value: "commands",
        },
        {
          name: "Solde",
          value: "coins",
        },
        {
          name: "PokéCoins-gagnés",
          value: "coins-won",
        },
        {
          name: "PokéCoins-perdus",
          value: "coins-lost",
        },
        {
          name: "PokéCoins-pariés",
          value: "coins-bet",
        },
      ],
    },
  ],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    const type = interaction.options.get("type")?.value || "coins";

    let pages, results, resultsText;
    switch (type) {
      /* Stat type top commands */
      case "answer":
      case "answers":
      case "answered":
      case "quiz":
        results = await getTop(100, "qz_answered");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            } réponses\` <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} quiz masters:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "messages":
      case "message":
      case "msg":
        results = await getTop(100, "messages");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            } messages\` <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} messages envoyés:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "commands":
      case "command":
      case "cmd":
        results = await getTop(100, "commands");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            } commandes\` <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} commandes utilisées:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "coins-won":
        results = await getTop(100, "coins-won");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            }\` ${serverIcons.money} <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} PokéCoins gagnés:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "coins-lost":
        results = await getTop(100, "coins-lost");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            }\` ${serverIcons.money} <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} PokéCoins perdus:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "coins-bet":
        results = await getTop(100, "coins-bet");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            }\` ${serverIcons.money} <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} PokéCoins pariés:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
        break;
      case "coins":
      default:
        results = await getTop(100, "coins");
        resultsText = results.map(
          (res, place) =>
            `**#${place + 1}** \`${
              res.amount ? res.amount.toLocaleString("fr-FR") : 0
            }\` ${serverIcons.money} <@!${res.user}>`
        );
        pages = new Array(Math.ceil(results.length / 10))
          .fill("")
          .map((page) => [
            `__***Top ${results.length} dresseurs:***__`,
            ...resultsText.splice(0, 10),
          ])
          .map((i) => ({ content: i.join("\n") }));
    }

    postPages(interaction, pages, 1, true);
  },
};
