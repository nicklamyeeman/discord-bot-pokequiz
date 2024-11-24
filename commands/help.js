const { EmbedBuilder, ChannelType } = require("discord.js");
const {
  upperCaseFirstLetter,
  getAvailableChannelList,
  formatChannelList,
} = require("../helpers.js");
const { prefix } = require("../config.js");

module.exports = {
  name: "help",
  aliases: ["h"],
  description:
    "Liste de toutes mes commandes ou informations sur une commande spécifique.",
  args: ["command_name?"],
  guildOnly: false,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: ["SendMessages"],
  execute: async (msg, args) => {
    let commands = msg.client.commands;
    if (msg.channel.type === ChannelType.DM) {
      commands = commands.filter((command) => !command.guildOnly);
    } else if (msg.channel.type === ChannelType.GuildText) {
      commands = commands.filter(
        (command) =>
          !msg.channel.permissionsFor(msg.member).missing(command.userperms)
            .length
      );
    }

    // Help on all commands
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setTitle("Help")
        .setDescription(
          [
            "Pour obtenir des informations plus détaillées sur une commande, utilisez ",
            "```css",
            `${prefix}help [command_name]`,
            "```",
          ].join("\n")
        )
        .setColor("#3498db");

      if (msg.channel.type === ChannelType.DM) {
        const description = commands
          .map(
            (command) =>
              `❯ **${upperCaseFirstLetter(command.name)}**: ${
                command.description.split("\n")[0]
              }`
          )
          .join("\n");
        embed.addFields({
          name: "__***Commandes:***__",
          value: description,
        });
      } else if (msg.channel.type === ChannelType.GuildText) {
        // Group the commands by their primary channel
        const restrictedCommands = [];
        const anyCommands = [];
        const groupedCommands = {};
        commands.forEach((command) => {
          // Not restricted to any channels
          if (command.channels === undefined) {
            return anyCommands.push(formattedCommand(command));
          }
          // No channels allowed, restricted to specific hidden channels
          if (command.channels.length === 0) {
            return restrictedCommands.push(formattedCommand(command));
          }
          const allowedChannels = getAvailableChannelList(
            msg.guild,
            command.channels
          );
          // No channels allowed, restricted from this server
          if (allowedChannels.size === 0) {
            return restrictedCommands.push(formattedCommand(command));
          }
          // Use the first channel name in the list
          const channelName = allowedChannels.first().name;
          if (groupedCommands[channelName] === undefined)
            groupedCommands[channelName] = [];
          groupedCommands[channelName].push(formattedCommand(command));
        });

        // Add the commands to the embed
        //
        // #anywhere
        // #channel-specific
        // #restricted
        if (anyCommands.length)
          embed.addFields({
            name: "__***#anywhere***__",
            value: anyCommands.join("\n"),
          });
        Object.entries(groupedCommands)
          .sort(([a], [b]) => `${a}`.localeCompare(`${b}`))
          .forEach(([channel, commands]) => {
            embed.addFields({
              name: `__***#${channel}***__`,
              value: commands.join("\n"),
            });
          });
        if (restrictedCommands.length)
          embed.addFields({
            name: "__***#restricted-channel***__",
            value: restrictedCommands.join("\n"),
          });
      }
      return msg.channel.send({ embeds: [embed] });
    }

    // Help on a specific command
    const name = args[0].toLowerCase();
    const command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      return msg.channel.send({
        content: "Ce n'est pas une commande valide!",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Help | ${upperCaseFirstLetter(command.name)}`)
      .setColor("#3498db")
      .addFields([
        {
          name: "❯ Description",
          value: `${command.description}`,
        },
        {
          name: "❯ Usage",
          value: `\`\`\`css\n${prefix}${command.name}${command.args
            .map((arg) => ` [${arg}]`)
            .join("")}\`\`\``,
        },
        {
          name: "❯ Aliases",
          value: `\`${command.aliases.join("`, `") || "-"}\``,
          inline: true,
        },
        {
          name: "❯ Cooldown",
          value: `\`${command.cooldown || 3} second(s)\``,
          inline: true,
        },
        {
          name: "❯ Guild Only",
          value: `\`${command.guildOnly}\``,
          inline: true,
        },
        {
          name: "❯ Channels",
          value: formatChannelList(msg.guild, command.channels),
          inline: true,
        },
      ]);

    if (command.helpFields) {
      embed.addFields({
        name: "\u200b\n═══ Plus d'informations ═══",
        value: "\u200b",
      });
      command.helpFields.forEach(([header, body, inline]) =>
        embed.addFields({
          name: header,
          value: body,
          inline: !!inline,
        })
      );
    }

    msg.channel.send({ embeds: [embed] });
  },
};

const formattedCommand = (command) =>
  `❯ **${upperCaseFirstLetter(command.name)}**: ${
    command.description.split("\n")[0]
  }`;
