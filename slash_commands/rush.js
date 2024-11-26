const { EmbedBuilder } = require("discord.js");
const {
  getLastRush,
  updateRushDate,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  TIME_BETWEEN_RUSH_CLAIMS,
} = require("../helpers.js");
const { setUserRequestStartRush } = require("../quiz/rush_time.js");

module.exports = {
  name: "rush",
  aliases: [],
  description: "Activez un rush pour accélérer les questions",
  args: [],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  channels: ["poke-quiz", "poke-quiz-dev"],
  execute: async (interaction) => {
    let { last_rush } = await getLastRush(interaction.user);

    if (last_rush > Date.now()) {
      last_rush = Date.now() - (TIME_BETWEEN_RUSH_CLAIMS + 1000);
    }

    // User already claimed within last 2 hours
    if (last_rush >= Date.now() - TIME_BETWEEN_RUSH_CLAIMS) {
      const time_left = +last_rush + TIME_BETWEEN_RUSH_CLAIMS - Date.now();
      const hours = Math.floor((time_left % DAY) / HOUR);
      const minutes = Math.floor((time_left % HOUR) / MINUTE);
      const seconds = Math.floor((time_left % MINUTE) / SECOND);
      let timeRemaining = "";
      if (+hours) timeRemaining += `${hours} heure${hours > 1 ? "s" : ""} `;
      if (+hours || +minutes)
        timeRemaining += `${minutes} minute${minutes > 1 ? "s" : ""} `;
      timeRemaining += `${seconds} seconde${seconds > 1 ? "s" : ""}`;
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#e74c3c")
            .setFooter({ text: "Prochain Rush disponible" })
            .setTimestamp(TIME_BETWEEN_RUSH_CLAIMS + +last_rush)
            .setDescription(
              `${interaction.user}\nVous avez déjà fait un rush récemment\nVous pouvez en démarrer un nouveau dans ${timeRemaining}`
            ),
        ],
      });
    }

    await updateRushDate(interaction.user);

    const message = [`Nouveau Rush demandé !`];
    setUserRequestStartRush(true);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#2ecc71")
          .setDescription(message.join("\n")),
      ],
    });
  },
};
