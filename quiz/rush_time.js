const { EmbedBuilder } = require("discord.js");
const { quizChannelID } = require("../config.js");

const isDaytime = () => {
  const today = new Date().getHours();
  return today >= 9 && today < 21;
};

const rushTimeBonus = 7;
let isRushTime = false;

let rushTimeShinyCount = 0;
const incrementRushTimeShinyCount = () => rushTimeShinyCount++;

const startRushTime = async (guild) => {
  if (!quizChannelID) {
    return;
  }
  const quiz_channel = await guild.channels.cache.find(
    (channel) => channel.id == quizChannelID
  );
  if (!quiz_channel) {
    return;
  }

  if (isRushTime) {
    const embed = new EmbedBuilder()
      .setTitle("Il y a déjà un Rush en cours !")
      .setDescription("Réessayez plus tard !")
      .setColor("#2ecc71");

    return await quiz_channel.send({
      embeds: [embed],
    });
  }

  isRushTime = true;
  rushTimeShinyCount = 0;
  const embed = new EmbedBuilder()
    .setTitle("C'est le début du Rush !")
    .setDescription(
      [
        "Le Rush dure 15 minutes !",
        `Les questions sont posées ${rushTimeBonus} × plus souvent`,
        `Les chances de tomber sur un shiny sont ${rushTimeBonus} × plus élevées`,
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

const endRushTime = async (guild) => {
  if (!quizChannelID) {
    return;
  }
  const quiz_channel = await guild.channels.cache.find(
    (channel) => channel.id == quizChannelID
  );
  if (!quiz_channel) {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Le Rush est terminé !")
    .setDescription(
      `Il y a eu ${rushTimeShinyCount} Pokémon Shiny pendant ce Rush`
    )
    .setColor("#e74c3c");

  rushTimeShinyCount = 0;
  isRushTime = false;
  return await quiz_channel.send({ embeds: [embed] });
};

module.exports = {
  isDaytime,
  rushTimeBonus,
  isRushTime,
  incrementRushTimeShinyCount,
  startRushTime,
  endRushTime,
};
