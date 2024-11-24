const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  aliases: [],
  description: "Réponse avec le ping actuel du robot sur Discord",
  args: [],
  guildOnly: false,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["SendMessages"],
  execute: async (msg, args) => {
    const embed = new EmbedBuilder()
      .setDescription(["```yaml", "Pong: --ms", "API: ---ms", "```"].join("\n"))
      .setColor("#3498db");

    const createdTime = Date.now();
    await msg.reply({ embeds: [embed], ephemeral: true }).then((m) => {
      const outboundDelay = Date.now() - createdTime;
      const APIDelay = Math.round(msg.client.ws.ping);
      embed.setDescription(
        [
          "```yaml",
          `Pong: ${outboundDelay}ms`,
          `API: ${APIDelay}ms`,
          "```",
        ].join("\n")
      );

      m.edit({ embeds: [embed], ephemeral: true });
    });
  },
};
