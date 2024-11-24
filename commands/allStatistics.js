const { EmbedBuilder } = require("discord.js");
const { getStatisticTypes, getOverallStatistic } = require("../database.js");

module.exports = {
  name: "allstatistics",
  aliases: ["allstats"],
  description: "Obtenir une vue d'ensemble des statistiques pour ce serveur",
  args: ["type?"],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["ManageGuild"],
  channels: ["bot-mod"],
  execute: async (msg, args) => {
    const type = args[0];

    const embed = new EmbedBuilder().setColor("#e74c3c");

    const statTypes = await getStatisticTypes();

    if (!type) {
      const results = await Promise.all(
        statTypes.map((s) => getOverallStatistic(s.name))
      );

      const padding = {
        name: Math.max(4, ...results.map((r) => r.name.length)),
        users: Math.max(
          5,
          ...results.map((r) => r.users.toLocaleString("fr-FR").length)
        ),
        value: Math.max(
          5,
          ...results.map((r) => r.value.toLocaleString("fr-FR").length)
        ),
      };

      embed
        .setTitle("__***Statistiques***__")
        .setColor("#3498db")
        .setDescription(
          [
            "```js",
            `${"name".padEnd(padding.name, " ")} | ${"users".padStart(
              padding.users,
              " "
            )} | ${"value".padStart(padding.value, " ")}`,
            "".padStart(6 + padding.name + padding.users + padding.value, "-"),
            ...results
              .sort((a, b) => b.value - a.value)
              .sort((a, b) => b.users - a.users)
              .map(
                (r) =>
                  `${r.name.padEnd(padding.name, " ")} | ${r.users
                    .toLocaleString("fr-FR")
                    .padStart(padding.users, " ")} | ${r.value
                    .toLocaleString("fr-FR")
                    .padStart(padding.value, " ")}`
              ),
            "```",
          ].join("\n")
        );

      return msg.reply({ embeds: [embed] });
    } else {
      const stat = statTypes.find((s) => s.name == type);

      if (!stat) {
        embed
          .setTitle("Statistiques")
          .setDescription(statTypes.map((s) => s.name).join("\n"));
        return msg.reply({ embeds: [embed] });
      }

      const stats = await getOverallStatistic(type);

      embed
        .setTitle(`__***${stats.name}***__`)
        .setColor("#3498db")
        .setDescription(
          [
            `**❯ Users:** ${stats.users.toLocaleString("fr-FR")}`,
            `**❯ Value:** ${stats.value.toLocaleString("fr-FR")}`,
          ].join("\n")
        );

      return msg.reply({ embeds: [embed] });
    }
  },
};
