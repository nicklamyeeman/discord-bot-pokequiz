const { EmbedBuilder } = require("discord.js");
const { backupDB } = require("../database.js");

module.exports = {
  name: "backup",
  aliases: [],
  description: "Sauvegarder la bdd",
  args: [],
  guildOnly: true,
  cooldown: 0.1,
  botperms: ["AttachFiles"],
  userperms: ["ManageGuild"],
  channels: ["bot-mod"],
  execute: async (msg, args) => {
    msg.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#2ecc71")
          .setDescription("Base de données sauvegardée!"),
      ],
    });
    backupDB(msg.guild);
  },
};
