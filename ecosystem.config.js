// pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "PokeQuiz-bot",
      script: "index.js",
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
    },
  ],
};
