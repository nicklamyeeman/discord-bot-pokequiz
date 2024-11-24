const { EmbedBuilder } = require("discord.js");
const { addAmount } = require("../database.js");
const { serverIcons } = require("../config.js");

module.exports = {
  name: "gift",
  aliases: [],
  description: "Donne des PokéCoins à un membre",
  args: ["points", "@user"],
  guildOnly: true,
  cooldown: 1,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["ManageGuild"],
  execute: async (msg, args) => {
    const amount = +(args.find((arg) => /^-?\d+$/.test(arg)) || 10);

    const embed = new EmbedBuilder().setColor("#e74c3c");

    if (isNaN(amount)) {
      embed.setDescription("Nombre de PokéCoins invalide...");
      return msg.channel.send({ embeds: [embed] });
    }
    if (!msg.mentions.users.size) {
      embed.setDescription("Aucun utilisateur mentionné...");
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [
      msg.author,
      `a donné ${amount.toLocaleString("fr-FR")} ${serverIcons.money} à :`,
      "",
    ];

    for (const [, user] of [...msg.mentions.users]) {
      const balance = await addAmount(user, amount);
      output.push(
        `${user}: ${balance.toLocaleString("fr-FR")} ${serverIcons.money}`
      );
    }

    embed.setColor("#2ecc71").setDescription(output.join("\n"));

    msg.channel.send({ embeds: [embed] });
  },
};
