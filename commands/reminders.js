const { MessageEmbed } = require('discord.js');
const { getUserReminders } = require('../database.js');

module.exports = {
  name        : 'reminders',
  aliases     : [],
  description : `Get a list of your pending reminders,
  List displays [ID] Date/Time and message`,
  args        : [],
  guildOnly   : true,
  cooldown    : 2,
  botperms    : ['SEND_MESSAGES', 'EMBED_LINKS'],
  userperms   : ['SEND_MESSAGES'],
  execute     : async (msg, args) => {
    const reminders = await getUserReminders(msg.author);

    const embed = new MessageEmbed()
      .setTitle('Pending Reminders:')
      .setColor('#3498db');

    // Add reminders fields
    reminders.forEach(r => embed.addField(`[${r.id}] **<t:${Math.ceil(+r.datetime / 1000)}:R>:**`, r.message.length >= 1000 ? `${r.message.substr(0, 1000)}...` : r.message));

    return msg.channel.send({ embed });
  },
};
