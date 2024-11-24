const {
  EmbedBuilder,
  ButtonBuilder,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require("discord.js");
const {
  getAmount,
  removeAmount,
  getPurchased,
  addPurchased,
  setTrainerCard,
} = require("../database.js");
const {
  upperCaseFirstLetter,
  postPages,
  trainerCardColors,
  totalTrainerImages,
  trainerCardBadgeTypes,
  randomString,
  error,
} = require("../helpers.js");
const { serverIcons } = require("../config.js");

module.exports = {
  name: "trainer-card-shop",
  aliases: ["trainercardshop", "tcshop", "profileshop"],
  description: "Parcourez la boutique des décorations pour la carte dresseur.",
  args: [
    {
      name: "page",
      type: ApplicationCommandOptionType.Integer,
      description: "Ouvrir la boutique à une page spécifique",
      required: false,
    },
  ],
  guildOnly: true,
  cooldown: 3,
  botperms: ["SendMessages", "EmbedLinks"],
  userperms: [],
  execute: async (interaction) => {
    let page = +(interaction.options.get("page")?.value || 1);

    if (isNaN(page) || page <= 0) page = 1;

    const balance = await getAmount(interaction.user);
    const purchasedBackgrounds = await getPurchased(
      interaction.user,
      "background"
    );
    const purchasedTrainers = await getPurchased(interaction.user, "trainer");

    let pages = [];

    trainerCardColors.forEach((color, index) => {
      const trainerCardFiles = new AttachmentBuilder()
        .setFile(`assets/images/trainer_card/${color}.png`)
        .setName(`${color}.png`);
      const embed = new EmbedBuilder()
        .setColor("#3498db")
        .setDescription(interaction.user.toString())
        .addFields({
          name: "Couleur",
          value: upperCaseFirstLetter(color),
          inline: true,
        })
        .addFields({
          name: "Prix",
          value: `${purchasedBackgrounds[index] ? "0" : "1000"} ${
            serverIcons.money
          }`,
          inline: true,
        })
        .addFields({
          name: "Description",
          value: "Changez l'arrière-plan de votre carte dresseur",
        })
        .setThumbnail(`attachment://${color}.png`);

      pages.push({ embeds: [embed], files: [trainerCardFiles] });
    });

    for (let trainerID = 0; trainerID <= totalTrainerImages; trainerID++) {
      const trainerFiles = new AttachmentBuilder()
        .setFile(`assets/images/trainers/${trainerID}.png`)
        .setName(`${trainerID}.png`);
      const embed = new EmbedBuilder()
        .setColor("#3498db")
        .setDescription(interaction.user.toString())
        .addFields({
          name: "ID Dresseur",
          value: `#${trainerID.toString().padStart(3, 0)}`,
          inline: true,
        })
        .addFields({
          name: "Prix",
          value: `${
            purchasedTrainers[trainerID]
              ? "0"
              : `${(Math.floor(trainerID / 10) + 1) * 1000}`
          } ${serverIcons.money}`,
          inline: true,
        })
        .addFields({
          name: "Description",
          value: "Changez l'image de votre dresseur",
        })
        .setThumbnail(`attachment://${trainerID}.png`);

      pages.push({ embeds: [embed], files: [trainerFiles] });
    }

    pages = pages.map((page, index) => {
      page.embeds[0].setFooter({
        text: `Solde: ${balance.toLocaleString("fr-FR")} | Page: ${index + 1}/${
          pages.length
        }`,
      });
      return page;
    });

    const buttons = await postPages(interaction, pages, page);

    const customID = randomString(6);

    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`purchase${customID}`)
        .setLabel("Acheter")
        .setStyle("Primary")
        .setEmoji("751765172523106377")
    );

    interaction.editReply({ components: [buttons] });
    const buyFilter = (i) =>
      i.customId === `purchase${customID}` && i.user.id === interaction.user.id;

    // Allow reactions for up to x ms
    const timer = 2e5; // (200 seconds)
    const buy = interaction.channel.createMessageComponentCollector({
      filter: buyFilter,
      time: timer,
    });

    buy.on("collect", async (i) => {
      await i.deferUpdate();
      await i.editReply({ components: [] });

      const currentBalance = await getAmount(interaction.user);

      try {
        const message = await interaction.fetchReply();
        const price = parseInt(
          message.embeds[0].fields.find((f) => f.name == "Prix").value
        );
        const pageNumber = (message.embeds[0].footer.text.match(/(\d+)\//) ||
          [])[1];
        // TODO: Update this if we add more item types in the future
        const itemType = message.embeds[0].fields.find(
          (f) => f.name == "Couleur"
        )
          ? "background"
          : "trainer";
        const itemIndex =
          pageNumber <= trainerCardColors.length
            ? pageNumber - 1
            : pageNumber - trainerCardColors.length - 1;

        // Initial embed object, with red color
        const embed = new EmbedBuilder().setColor("#e74c3c");

        // Couldn't read the price correctly
        if (isNaN(price)) throw new Error("Price is NaN");

        // Item too expensive
        if (price > currentBalance) {
          embed.setDescription(
            [
              interaction.user,
              "Impossible d'acheter!",
              "",
              "_vous n'avez pas assez d'argent_",
            ].join("\n")
          );

          return interaction.followUp({ embeds: [embed] });
        }

        // Item purchased
        let remainingBalance;
        if (price > 0) {
          await addPurchased(interaction.user, itemType, itemIndex);
          remainingBalance = await removeAmount(interaction.user, price);
        } else {
          remainingBalance = currentBalance;
        }

        // If user updated their profile, give them the Boulder Badge
        await addPurchased(
          interaction.user,
          "badge",
          trainerCardBadgeTypes.Boulder
        );

        await setTrainerCard(interaction.user, itemType, itemIndex);

        embed
          .setColor("#2ecc71")
          .setDescription(
            [
              interaction.user,
              "Achat effectué!",
              "",
              `Votre nouveau ${itemType} a été mis à jour!`,
            ].join("\n")
          )
          .setFooter({
            text: `Solde: ${remainingBalance.toLocaleString("fr-FR")}`,
          });
        return interaction.followUp({ embeds: [embed] });
      } catch (e) {
        error("Failed to purchase item", e);
        const embed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setDescription(
            [
              interaction.user,
              "Achat échoué!",
              "",
              "Essayez plus tard...",
            ].join("\n")
          );

        return interaction.followUp({ embeds: [embed] });
      }
    });
  },
};
