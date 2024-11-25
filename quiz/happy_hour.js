const { EmbedBuilder } = require("discord.js");
const { quizChannelID } = require("../config.js");
const { HOUR } = require("../helpers.js");

const happyHourBonus = 7;
const happyHourHours = 7;
const slowModeSeconds = 2;
const isHappyHour = () => Date.now() % (happyHourHours * HOUR) < HOUR;
const nextHappyHour = (now = new Date()) =>
  new Date(now - (now % (happyHourHours * HOUR)) + happyHourHours * HOUR);
let happyHourShinyCount = 0;
const incrementHappyHourShinyCount = () => happyHourShinyCount++;

const startHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(
    (c) => c.id == quizChannelID
  );
  if (!quiz_channel) return;
  // players can type as fast as they want
  quiz_channel.setRateLimitPerUser(0, "Happy Hour!").catch((O_o) => {});
  setTimeout(
    () =>
      quiz_channel
        .setRateLimitPerUser(slowModeSeconds, "Happy Hour!")
        .catch((O_o) => {}),
    HOUR
  );
  happyHourShinyCount = 0;
  const embed = new EmbedBuilder()
    .setTitle("C'est le Happy Hour!")
    .setDescription(
      [
        "Le Happy Hour dure 1 heure !",
        `Les questions sont posées ${happyHourBonus} × plus souvent`,
        `Les chances de tomber sur un shiny sont ${happyHourBonus} × plus élevées`,
        "",
        "Bonne chance !",
      ].join("\n")
    )
    .setColor("#2ecc71");

  return await quiz_channel.send({
    content: "<@&1309397600558125096>",
    embeds: [embed],
  });
};

const endHappyHour = async (guild) => {
  // If no quiz channel or ID, return
  if (!quizChannelID) return;
  const quiz_channel = await guild.channels.cache.find(
    (c) => c.id == quizChannelID
  );
  if (!quiz_channel) return;
  // players can only type once per é seconds
  quiz_channel
    .setRateLimitPerUser(slowModeSeconds, "Happy Hour!")
    .catch((O_o) => {});
  const embed = new EmbedBuilder()
    .setTitle("Le Happy Hour est terminé !")
    .setDescription(
      [
        `Il y a eu ${happyHourShinyCount} Pokémon Shiny pendant cet Happy Hour`,
        "Le prochain Happy Hour sera :",
      ].join("\n")
    )
    .setTimestamp(nextHappyHour())
    .setColor("#e74c3c");

  happyHourShinyCount = 0;
  return await quiz_channel.send({ embeds: [embed] });
};

module.exports = {
  happyHourBonus,
  happyHourHours,
  isHappyHour,
  nextHappyHour,
  startHappyHour,
  endHappyHour,
  incrementHappyHourShinyCount,
};
