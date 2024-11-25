const { EmbedBuilder } = require("discord.js");
const { quizChannelID, serverIcons } = require("../config.js");
const { addAmount, addStatistic, addPurchased } = require("../database.js");
const {
  SECOND,
  MINUTE,
  error,
  warn,
  trainerCardBadgeTypes,
} = require("../helpers.js");
const { getQuizQuestion } = require("./quiz_questions.js");
const { isDaytime, isRushTime, rushTimeBonus } = require("./rush_time.js");
const { trainerCardBadges } = require("../helpers/trainer_card.js");

// Entre 1 et 3 minutes avant a prochaine question entre 9h et 21h GMT
const getTimeLimit = () =>
  Math.floor(Math.random() * (2 * MINUTE)) + 1 * MINUTE;

// Entre 5 et 10 minutes avant a prochaine question entre 21h et 9h GMT
const getSlowTimeLimit = () =>
  Math.floor(Math.random() * (5 * MINUTE)) + 5 * MINUTE;

const ANSWER_TIME_LIMIT = 7 * SECOND;

const newQuiz = async (guild, reoccur = false) => {
  if (!quizChannelID) {
    return;
  }
  const quiz_channel = await guild.channels.cache.find(
    (channel) => channel.id == quizChannelID
  );
  if (!quiz_channel) {
    return;
  }

  // Generate and send a random question
  let quiz;
  while (!quiz) {
    try {
      quiz = await getQuizQuestion();
    } catch (e) {
      error(e);
    }
  }

  const daytime = isDaytime();
  let time_limit = daytime ? getTimeLimit() : getSlowTimeLimit();

  if (isRushTime) {
    quiz.embed.setFooter({
      text: `Happy Hour!\n(${rushTimeBonus}× plus de questions, ${rushTimeBonus}× plus de Shiny)`,
    });
  }

  const bot_message = await quiz_channel
    .send({ embeds: [quiz.embed], files: quiz.files })
    .catch((...args) => warn("Unable to send quiz question", ...args));

  if (!bot_message) {
    return setTimeout(() => newQuiz(guild, reoccur), MINUTE);
  }

  if (reoccur) {
    setTimeout(() => newQuiz(guild, reoccur), time_limit + ANSWER_TIME_LIMIT);
  }

  const filter = (m) =>
    quiz.answer.test(
      m.content
        .replace(/(baie|fossile)\s*/i, "")
        .replaceAll(/(é|ê|è|ë)/gi, "e")
        .replaceAll(/(ô|ö)/gi, "o")
        .replaceAll(/(î|ï)/gi, "i")
        .replaceAll(/(â|à|ä)/gi, "a")
        .replaceAll(/(ç)/gi, "c")
    );

  let finished = 0;

  const winners = new Set();
  const winner_data = [];

  const correctCollector = quiz_channel.createMessageCollector({
    filter,
    time: time_limit,
  });

  correctCollector.on("collect", async (m) => {
    const user = m.author;
    if (!finished) {
      finished = m.createdTimestamp;
    } else {
      if (winners.has(user.id)) {
        return;
      }
      quiz.amount = Math.ceil(quiz.amount * 0.66);
    }
    winners.add(user.id);
    const amount = quiz.amount;

    m.react(serverIcons.money.match(/:(\d+)>/)[1]);
    if (quiz.shiny) {
      m.react("✨");
      addStatistic(user, "qz_answered_shiny");
    }

    const [balance, answered] = await Promise.all([
      addAmount(user, amount),
      addStatistic(user, "qz_answered"),
    ]);
    addStatistic(user, "qz_coins_won", amount);

    // If user has answered more than 100 questions, give them the Marsh Badge
    if (answered == 100) {
      await addPurchased(user, "badge", trainerCardBadgeTypes.Marsh);
      const congratsEmbed = new EmbedBuilder()
        .setTitle("Félicitations !")
        .setColor("Random")
        .setDescription(
          [
            m.author.toString(),
            `Vous avez débloqué le ${
              trainerCardBadges[trainerCardBadgeTypes.Marsh].icon
            } badge Marais pour avoir répondu à ${answered} questions !`,
          ].join("\n")
        );
      m.channel.send({ embeds: [congratsEmbed] });
    }

    if (answered % 1000 == 0) {
      const congratsEmbed = new EmbedBuilder()
        .setTitle("Félicitations !")
        .setColor("Random")
        .setDescription(
          [
            m.author.toString(),
            `Vous avez répondu à ${answered.toLocaleString(
              "fr-FR"
            )} questions !`,
          ].join("\n")
        );
      m.channel.send({ embeds: [congratsEmbed] });
    }

    winner_data.push({ user, amount, balance, answered, url: m.url });
  });

  // Gather incorrect answers
  const incorrectCollector = quiz_channel.createMessageCollector({
    filter: (m) => !filter(m),
    time: time_limit,
  });
  incorrectCollector.on("collect", async (m) => {
    const reaction = quiz.incorrectReaction?.(m.content);

    if (reaction) {
      m.react(reaction);
    }
  });

  quiz_channel
    .awaitMessages({ filter, max: 1, time: time_limit, errors: ["time"] })
    .then(() => {
      const botEmbed = bot_message.embeds[0];
      setTimeout(() => {
        correctCollector.stop();
        incorrectCollector.stop();

        if (winner_data.length) {
          const description = winner_data
            .sort((a, b) => b.amount - a.amount)
            .map((w) => `${w.user}: **+${w.amount} ${serverIcons.money}**`);
          const embed = new EmbedBuilder()
            .setTitle("**Classement :**")
            .setDescription(description.join("\n"))
            .setColor("#2ecc71");

          bot_message.channel
            .send({ embeds: [embed] })
            .catch((...args) =>
              warn("Unable to send quiz winner message\n", ...args)
            );
        }
        quiz.end(bot_message, botEmbed);
      }, ANSWER_TIME_LIMIT);
    })
    .catch(() => {
      const botEmbed = bot_message.embeds[0];
      quiz.end(bot_message, botEmbed);
    });
};

module.exports = {
  newQuiz,
};
