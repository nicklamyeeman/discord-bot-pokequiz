require('dotenv').config()

module.exports = {
  development: true,
  prefix: "!",
  token: process.env.DISCORD_BOT_TOKEN,
  ownerID: process.env.DISCORD_OWNER_ID,

  backupChannelID: process.env.BACKUP_CHANNEL_ID,
  quizChannelID: process.env.QUIZ_CHANNEL_ID,

  serverIcons: {
    money: "<:money:1309545038761689098>",
    kabuto: "<:kabuto:1309568105382547487>",
  },
};
