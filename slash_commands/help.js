const {
  EmbedBuilder,
  ChannelType,
  ApplicationCommandOptionType,
} = require("discord.js");
const { getAvailableChannelList, formatChannelList } = require("../helpers.js");

const getCommandSuggestion = (map, name) => {
  const cmd = map.find((c) => c.name.toLowerCase() === name.toLowerCase()) || {
    id: 0,
    name,
  };
  return `</${cmd.name}:${cmd.id}>`;
};

const formattedCommand = (map, command) =>
  `❯ **${getCommandSuggestion(map, command.name)}**: ${
    command.description.split("\n")[0]
  }`;

module.exports = {
  name: "help",
  aliases: ["commands"],
  description:
    "Liste de toutes mes commandes ou informations sur une commande spécifique.",
  args: [
    {
      name: "command",
      type: ApplicationCommandOptionType.String,
      description: "Obtenir de l'aide sur une commande spécifique.",
      required: false,
    },
  ],
  guildOnly: false,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    let command = interaction.options.get("command")?.value;
    let commands = interaction.client.slashCommands;
    if (interaction.channel.type === ChannelType.DM) {
      commands = commands.filter((command) => !command.guildOnly);
    } else if (interaction.channel.type === ChannelType.GuildText) {
      commands = commands.filter(
        (command) =>
          !interaction.channel
            .permissionsFor(interaction.member)
            .missing(command.userperms).length
      );
    }

    const commandsMap =
      interaction.channel.type === ChannelType.DM
        ? [...interaction.client.commands.cache].map((c) => c[1])
        : [...interaction.guild.commands.cache].map((c) => c[1]);

    // Help on all commands
    if (!command) {
      const embed = new EmbedBuilder()
        .setTitle("Help")
        .setDescription(
          [
            `Pour obtenir des informations plus détaillées sur une commande, utilisez ${getCommandSuggestion(
              commandsMap,
              "help"
            )}:`,
            "```css",
            "/help [command_name]",
            "```",
          ].join("\n")
        )
        .setColor("#3498db");

      if (interaction.channel.type === ChannelType.DM) {
        const description = commands
          .map((command) => formattedCommand(commandsMap, command))
          .join("\n");
        embed.addFields({
          name: "__***Commandes:***__",
          value: description,
        });
      } else if (interaction.channel.type === ChannelType.GuildText) {
        // Group the commands by their primary channel
        const restrictedCommands = [];
        const anyCommands = [];
        const groupedCommands = {};
        commands
          .filter((command) => {
            // Check the user has the required permissions
            if (
              interaction.channel.type === ChannelType.GuildText &&
              interaction.channel
                .permissionsFor(interaction.member)
                .missing(command.userperms).length
            ) {
              return false;
            }

            // Check user has the required roles
            if (
              interaction.channel.type === ChannelType.GuildText &&
              command.userroles?.length
            ) {
              const hasRolePerms = command.userroles.some((r) =>
                interaction.member.roles.cache.find(
                  (role) => role.id == r || role.name == r
                )
              );
              if (!hasRolePerms) return false;
            }

            return true;
          })
          .forEach((command) => {
            // Not restricted to any channels
            if (command.channels === undefined) {
              return anyCommands.push(formattedCommand(commandsMap, command));
            }
            // No channels allowed, restricted to specific hidden channels
            if (command.channels.length === 0) {
              return restrictedCommands.push(
                formattedCommand(commandsMap, command)
              );
            }
            const allowedChannels = getAvailableChannelList(
              interaction.guild,
              command.channels
            );
            // No channels allowed, restricted from this server
            if (allowedChannels.size === 0) {
              return restrictedCommands.push(
                formattedCommand(commandsMap, command)
              );
            }
            // Use the first channel name in the list
            const channelName = allowedChannels.first().name;
            if (groupedCommands[channelName] === undefined)
              groupedCommands[channelName] = [];
            groupedCommands[channelName].push(
              formattedCommand(commandsMap, command)
            );
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
      return interaction.reply({ embeds: [embed] });
    }

    // Help on a specific command
    const name = command.toLowerCase();
    command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name));

    if (!command) {
      return interaction.reply("Ce n'est pas une commande valide!");
    }

    const embed = new EmbedBuilder()
      .setTitle(`Help | ${getCommandSuggestion(commandsMap, command.name)}`)
      .setColor("#3498db")
      .addFields({
        name: "❯ Description",
        value: `${command.description || "---"}`,
        inline: false,
      })
      .addFields({
        name: "❯ Usage",
        value: `\`\`\`css\n/${command.name}${command.args
          .map((arg) => ` [${arg.name}${arg.required ? "" : "?"}]`)
          .join("")}\`\`\``,
        inline: false,
      })
      .addFields({
        name: "❯ Cooldown",
        value: `\`${command.cooldown || 3} second(s)\``,
        inline: true,
      })
      .addFields({
        name: "❯ Guild Only",
        value: `\`${command.guildOnly}\``,
        inline: true,
      })
      .addFields({
        name: "❯ Channels",
        value: formatChannelList(interaction.guild, command.channels),
        inline: true,
      });

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

    interaction.reply({ embeds: [embed] });
  },
};
