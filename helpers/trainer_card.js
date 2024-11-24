const trainerCardColors = [
  "blue",
  "purple",
  "pink",
  "red",
  "green",
  "bronze",
  "silver",
  "gold",
];

const trainerCardBadgeTypes = {
  Boulder: 0,
  Cascade: 1,
  Thunder: 2,
  Rainbow: 3,
  Marsh: 4,
  Soul: 5,
  Volcano: 6,
  Earth: 7,
};

const trainerCardBadges = [
  {
    // 0
    name: "Roche",
    description: "Acheter un objet dans la boutique",
    icon: "<:badge_roche:1309545097142079538>",
    // card stuff
    src: "./assets/images/badges/0.png",
    left: 27,
    top: 123,
  },
  {
    // 1
    name: "Cascade",
    description: "Utiliser 1,000 fois une commande de bot",
    icon: "<:badge_cascade:1309545119879270461>",
    // card stuff
    src: "./assets/images/badges/1.png",
    left: 53,
    top: 123,
  },
  {
    // 2
    name: "Foudre",
    description:
      "Envoyer 2,500 messages dans le server\n(30s entre chaque message)",
    icon: "<:badge_foudre:1309545260074008706>",
    // card stuff
    src: "./assets/images/badges/2.png",
    left: 74,
    top: 122,
  },
  {
    // 3
    name: "Prisme",
    description: "Faire + de 5,000 pièces de gain en une seule partie",
    icon: "<:badge_prisme:1309545282177863732>",
    // card stuff
    src: "./assets/images/badges/3.png",
    left: 98,
    top: 122,
  },
  {
    // 4
    name: "Marais",
    description: "Jouer au casino 1,000 fois\n-OU-Répondre à 100 questions",
    icon: "<:badge_marais:1309545320614465586>",
    // card stuff
    src: "./assets/images/badges/4.png",
    left: 123,
    top: 123,
  },
  {
    // 5
    name: "Ame",
    description: "Avoir + de 25,000 pièces en banque",
    icon: "<:badge_ame:1309545301262209066>",
    // card stuff
    src: "./assets/images/badges/5.png",
    left: 147,
    top: 123,
  },
  {
    // 6
    name: "Volcan",
    description: "???",
    icon: "<:badge_volcan:1309545341737238612>",
    // card stuff
    src: "./assets/images/badges/6.png",
    left: 171,
    top: 122,
  },
  {
    // 7
    name: "Terre",
    description: "???",
    icon: "<:badge_terre:1309545359672086588>",
    // card stuff
    src: "./assets/images/badges/7.png",
    left: 194,
    top: 122,
  },
];

// highest trainer image ID 0 → X
const totalTrainerImages = 56;

module.exports = {
  trainerCardColors,
  trainerCardBadgeTypes,
  trainerCardBadges,
  totalTrainerImages,
};
