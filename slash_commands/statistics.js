const {
  EmbedBuilder,
  ApplicationCommandType,
  ApplicationCommandOptionType,
} = require("discord.js");
const { getStatistic } = require("../database.js");

module.exports = {
  type: ApplicationCommandType.User,
  name: "statistics",
  aliases: ["stats"],
  description: "Obtenez une vue d'ensemble de vos statistiques pour ce serveur",
  args: [
    {
      name: "user",
      type: ApplicationCommandOptionType.User,
      description: "Obtenir les statistiques d'un autre utilisateur",
      required: false,
    },
  ],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    const id = interaction.options.get("user")?.value;

    let user = interaction.user;

    if (id) {
      const member = await interaction.member.guild.members
        .fetch(id)
        .catch((e) => {});
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setDescription(`${interaction.user}\nID utilisateur invalide.`);
        return interaction.reply({ embeds: [embed] });
      }
      user = member.user;
    }

    const embed = new EmbedBuilder()
      .setTitle("Statistiques")
      .setDescription(user.toString())
      .setColor("#3498db");

    const [
      messages,
      commands,
      // Games Corner
      gc_games_played,
      gc_games_won,
      gc_games_tied,
      gc_games_lost,
      gc_coins_bet,
      gc_coins_won,
      // Quiz
      qz_answered,
      qz_coins_won,
    ] = await Promise.all([
      getStatistic(user, "messages"),
      getStatistic(user, "commands"),
      // Games Corner
      getStatistic(user, "gc_games_played"),
      getStatistic(user, "gc_games_won"),
      getStatistic(user, "gc_games_tied"),
      getStatistic(user, "gc_games_lost"),
      getStatistic(user, "gc_coins_bet"),
      getStatistic(user, "gc_coins_won"),
      // Quiz
      getStatistic(user, "qz_answered"),
      getStatistic(user, "qz_coins_won"),
    ]);

    embed.addFields({
      name: "__***#general***__",
      value: [
        `**❯ Messages:** ${messages.toLocaleString("fr-FR")}`,
        `**❯ Commandes:** ${commands.toLocaleString("fr-FR")}`,
      ].join("\n"),
    });

    embed.addFields({
      name: "__***#casino***__",
      value: [
        `**❯ Jeux joués:** ${gc_games_played.toLocaleString("fr-FR")}`,
        `**❯ Jeux gagnés:** ${gc_games_won.toLocaleString("fr-FR")}`,
        `**❯ Jeux à égalité:** ${gc_games_tied.toLocaleString("fr-FR")}`,
        `**❯ Jeux perdus:** ${gc_games_lost.toLocaleString("fr-FR")}`,
        `**❯ PokéCoins misés:** ${gc_coins_bet.toLocaleString("fr-FR")}`,
        `**❯ PokéCoins gagnés:** ${gc_coins_won.toLocaleString("fr-FR")}`,
      ].join("\n"),
    });

    embed.addFields({
      name: "__***#poke-quiz***__",
      value: [
        `**❯ Réponses correctes:** ${qz_answered.toLocaleString("fr-FR")}`,
        `**❯ PokéCoins gagnés:** ${qz_coins_won.toLocaleString("fr-FR")}`,
      ].join("\n"),
    });

    return interaction.reply({ embeds: [embed] });
  },
};
