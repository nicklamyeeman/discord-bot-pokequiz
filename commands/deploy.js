// TODO: Make sure this still works!!
// Maybe also remove the auto perms stuff from the slash command handler
const { error } = require("../helpers.js");
const { ownerID } = require("../config.js");

module.exports = {
  name: "deploy",
  aliases: [],
  description: "Déployer les nouvelles commandes",
  args: [],
  guildOnly: true,
  cooldown: 0.1,
  botperms: ["SendMessages"],
  userperms: ["ManageGuild"],
  channels: ["bot-mod"],
  execute: async (msg, args) => {
    if (!ownerID || msg.author.id !== ownerID) return;
    try {
      console.log("Deploying new commands!");
      // Add our slash commands
      const data = msg.client.slashCommands.map((c) => ({
        name: c.name,
        description: c.description,
        options: c.args,
        defaultPermission:
          (!c.userperms || c.userperms?.length == 0) &&
          (!c.userroles || c.userroles?.length == 0),
      }));
      // Add any context menu commands
      data.push(
        ...msg.client.slashCommands
          .filter((c) => c.type)
          .map((c) => ({
            name: c.name,
            type: c.type,
            defaultPermission:
              (!c.userperms || c.userperms?.length == 0) &&
              (!c.userroles || c.userroles?.length == 0),
          }))
      );
      // Update the current list of commands for this guild
      await msg.guild.commands.set(data);
      msg.reply(
        `Commandes du serveur mises à jour !\n\`\`\`yaml\nCommands: ${
          data.length
        }\nRestricted: ${
          data.filter((c) => !c.defaultPermission).length
        }\n\`\`\``
      );
    } catch (e) {
      error("Unable to deploy new commands:\n", e);
    }
    return;
  },
};
