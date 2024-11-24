/*
Command used to generate the list of aliases:
!eval
```js
const commands = msg.client.commands.map(c => [c.name, ...c.aliases]).flat();
return `'${msg.client.slashCommands.map(c => [c.name, ...c.aliases]).flat().filter(c => !commands.includes(c)).join("','")}'`;
```
*/

const { EmbedBuilder } = require("discord.js");
const { prefix } = require("../config");

module.exports = {
  name: "slashcommandinfo",
  aliases: [
    "badges",
    "balance",
    "bal",
    "$",
    "fire-water-grass",
    "fwg",
    "fgw",
    "gfw",
    "gwf",
    "wfg",
    "wgf",
    "fire-water-grass",
    "flip",
    "coin",
    "commands",
    "slots",
    "slot",
    "spin",
    "wheel",
    "statistics",
    "stats",
    "top",
    "leaderboard",
    "lb",
    "trainer-card-shop",
    "trainercardshop",
    "tcshop",
    "profileshop",
    "trainer-card",
    "trainercard",
    "tc",
    "profile",
  ],
  description: "Infos sur les commandes slash",
  args: [],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["SendMessages"],
  execute: async (msg, args) => {
    const commandName = msg.content
      .slice(prefix.length)
      .trim()
      .split(/,?\s+/)
      .shift()
      ?.toLowerCase();
    const command = msg.client.slashCommands.find(
      (c) => c.name == commandName || c.aliases?.includes(commandName)
    );

    const embed = new EmbedBuilder()
      .setDescription(
        `Il semble que vous essayez d'utiliser une commande,
Cette commande a probablement été remplacée par une commande slash...
Essayez d'utiliser \`/${command ? command.name : "help"}\` à la place`
      )
      .setColor("Random");

    return msg.reply({ embeds: [embed] });
  },
};
