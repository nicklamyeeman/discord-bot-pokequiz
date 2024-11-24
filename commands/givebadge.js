const { EmbedBuilder } = require("discord.js");
const { addPurchased } = require("../database.js");
const { trainerCardBadges } = require("../helpers.js");

module.exports = {
  name: "give-badge",
  aliases: ["givebadge"],
  description: "Donne un badge à un membre",
  args: ["badge icon", "@user"],
  guildOnly: true,
  cooldown: 1,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["ManageGuild"],
  execute: async (msg, args) => {
    const badgeIcon = args.find((arg) =>
      new RegExp(trainerCardBadges.map((b) => b.icon).join("|")).test(arg)
    );
    const badgeIndex = trainerCardBadges.findIndex((b) => b.icon == badgeIcon);
    const badge = trainerCardBadges[badgeIndex];

    const embed = new EmbedBuilder().setColor("#e74c3c");

    if (!badge) {
      embed.setDescription("Badge invalide...");
      return msg.channel.send({ embeds: [embed] });
    }
    if (!msg.mentions.users.size) {
      embed.setDescription("Aucun utilisateur mentionné...");
      return msg.channel.send({ embeds: [embed] });
    }

    const output = [
      msg.author,
      `a donné le ${badge.icon} Badge ${badge.name} à :`,
      "",
    ];

    for (const [, user] of [...msg.mentions.users]) {
      await addPurchased(user, "badge", badgeIndex);
      output.push(`${user}`);
    }

    embed.setColor("#2ecc71").setDescription(output.join("\n"));

    msg.channel.send({ embeds: [embed] });
  },
};
