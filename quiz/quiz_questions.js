const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { serverIcons } = require("../config.js");
const {
  pokemonList,
  PokemonType,
  randomFromArray,
  enumStrings,
  GameConstants,
  upperCaseFirstLetter,
  BadgeEnums,
  GymList,
  warn,
  pokemonTypeIcons,
  StoneType,
  berryType,
} = require("../helpers.js");
const {
  getIsRushTime,
  rushTimeBonus,
  incrementRushTimeShinyCount,
} = require("./rush_time.js");
const {
  getRandomPokemon,
  getWhosThatPokemonImage,
  getWhosThatPokemonFinalImage,
  isFemale,
} = require("./quiz_functions.js");

const getAmount = () => Math.floor(Math.random() * 7) * 5 + 30;
const getShinyAmount = () => 100 + getAmount();

const isRushTime = getIsRushTime();

const shinyChance = 54;
const isShiny = (chance = shinyChance) => {
  const shiny = !Math.floor(
    Math.random() * (isRushTime ? chance / rushTimeBonus : chance)
  );
  if (shiny && isRushTime) {
    incrementRushTimeShinyCount();
  }
  return shiny;
};

const answerNormalized = (answer) =>
  answer
    .replaceAll(/(é|ê|è|ë)/gi, "e")
    .replaceAll(/(ô|ö)/gi, "o")
    .replaceAll(/(î|ï)/gi, "i")
    .replaceAll(/(â|à|ä)/gi, "a")
    .replaceAll(/(ç)/gi, "c")
    .replaceAll(/\W|_/gi, ".?");

const pokemonNameNormalized = (name) =>
  answerNormalized(name.replace(/\s?\(.+\)$/, ""));
const pokemonNameAnswer = (name) =>
  new RegExp(`^\\W*${pokemonNameNormalized(name)}\\b`, "i");
const evolutionNormalized = (evolution) =>
  answerNormalized(evolution).replace(/(Niveau)\s*/gi, "($1)?");
const evolutionAnswer = (evolution) =>
  new RegExp(`^\\W*${evolutionNormalized(evolution)}\\b`, "i");
const fossilNormalized = (fossil) =>
  answerNormalized(fossil.replace(/fossile\s*/i, ""));
const fossilAnswer = (fossil) =>
  new RegExp(`^\\W*${fossilNormalized(fossil)}\\b`, "i");
const berryNormalized = (berry) => answerNormalized(berry);
const berryAnswer = (berry) =>
  new RegExp(`^\\W*${berryNormalized(berry)}\\b`, "i");
const regionNormalized = (region) => answerNormalized(region);
const regionAnswer = (region) =>
  new RegExp(`^\\W*${regionNormalized(region)}\\b`, "i");
const townNormalized = (town) => answerNormalized(town);
const townAnswer = (town) => new RegExp(`^\\W*${townNormalized(town)}\\b`, "i");
const typeNormalized = (type) => answerNormalized(type);
const typeAnswer = (type) => new RegExp(`^\\W*${typeNormalized(type)}\\b`, "i");
const gymLeaderNormalized = (leader) =>
  answerNormalized(leader.replaceAll(/\d/gi, ""));
const gymLeaderAnswer = (leader) =>
  new RegExp(`^\\W*${gymLeaderNormalized(leader)}\\b`, "i");

const getPokemonByName = (name) => pokemonList.find((p) => p.name == name);
const berryList = Object.keys(berryType).filter((b) => isNaN(b) && b != "None");
const regionList = enumStrings(GameConstants.Region).filter(
  (t) => t != "final" && t != "none"
);
const pokemonListWithEvolution = pokemonList.filter(
  (p) => p.evolutions && p.evolutions.length
);
const badgeList = Object.keys(BadgeEnums).filter(
  (b) => isNaN(b) && !b.startsWith("Elite")
);
const gymsWithBadges = Object.keys(GymList).filter((t) =>
  badgeList.includes(BadgeEnums[GymList[t].badgeReward])
);

const allGyms = Object.keys(GymList);
const allGymTypes = {};
Object.keys(GymList).forEach((gym) => {
  const pokemonNames = GymList[gym].pokemons.map((p) => p.name);
  const pokemon = pokemonList.filter((p) => pokemonNames.includes(p.name));
  const types = pokemon.map((p) => p.type).flat();
  const typeCount = {};
  types.forEach((t) => (typeCount[t] = (typeCount[t] || 0) + 1));
  const maxTypeAmount = Math.max(...Object.values(typeCount));
  const mainTypes = Object.entries(typeCount)
    .filter(([t, c]) => c >= maxTypeAmount)
    .map(([t]) => PokemonType[t]);
  allGymTypes[gym] = mainTypes;
});

const whosThatPokemon = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = getRandomPokemon();
      const answer = pokemonNameAnswer(pokemon.name);

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = ["Quel est le nom de ce Pokémon ?"];
      description.push(`**+${amount} ${serverIcons.money}**`);

      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨`);
        amount += shiny_amount;
      }

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez ce Pokémon !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            pokemon,
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle(`C'est ${pokemon.name}!`)
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const whatIsThatBerry = () => {
  const berry = randomFromArray(berryList);
  const answer = berryAnswer(berry);

  const amount = getAmount();

  const description = ["Quel est le nom de cette Baie ?"];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const imageUrl = `assets/images/items/berry/${berry}.png`;

  const attachment = new AttachmentBuilder()
    .setFile(imageUrl)
    .setName("berry.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez la Baie !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://berry.png")
    .setColor("#0690fe");

  return {
    embed,
    answer,
    amount,
    files: [attachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est la Baie ${berry} !`)
        .setImage("attachment://berry.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [attachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const howDoesThisPokemonEvolve = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = randomFromArray(
        pokemonListWithEvolution.filter((p) =>
          p.evolutions.some((e) => e.trigger === 1 || e.trigger === 2)
        )
      );
      const allEligableEvolutions = pokemon.evolutions.filter(
        (e) => e.trigger === 1 || e.trigger === 2
      );
      const allEvolvedNames = [
        ...new Set(allEligableEvolutions.map((e) => e.evolvedPokemon)),
      ];
      const levelEvolution = [
        ...new Set(
          allEligableEvolutions
            .flatMap((evolution) => evolution.restrictions)
            .filter(
              (restriction) => restriction.__class === "PokemonLevelRequirement"
            )
            .map((restriction) => `Niveau ${restriction.requiredValue}`)
        ),
      ];

      const itemEvolution = [
        ...new Set(
          allEligableEvolutions
            .map((e) => StoneType[e.stone])
            .filter((e) => e != undefined)
        ),
      ];

      const allAnswers = [...levelEvolution, ...itemEvolution].map((e) =>
        e.replaceAll(/_/g, " ")
      );

      const answer = new RegExp(
        `^\\W*${allAnswers.map((e) => evolutionNormalized(e)).join("|")}\\b`,
        "i"
      );
      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const title =
        `${levelEvolution.length > 0 ? "Niveau" : ""}` +
        `${
          levelEvolution.length > 0 && itemEvolution.length > 0 ? " ou " : ""
        }` +
        `${itemEvolution.length > 0 ? "Item" : ""}`;
      const description = [
        `Quel ${title} est nécessaire pour faire évoluer ce Pokémon?`,
      ];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const incorrectReaction = (m) => {
        const levelRegEx = /^(Niveau\s*)?(\d+).*/i;
        const match = m.match(levelRegEx);
        const guessedLvl = match ? match[2] : "no match";
        if (isNaN(guessedLvl) || levelEvolution.length == 0) {
          return undefined;
        }
        if (
          levelEvolution.some(
            (e) => parseFloat(e.match(levelRegEx)[2]) > guessedLvl
          )
        ) {
          return "⬆️";
        }

        if (
          levelEvolution.some(
            (e) => parseFloat(e.match(levelRegEx)[2]) < guessedLvl
          )
        ) {
          return "⬇️";
        }
      };

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Comment évolue ce Pokémon ?")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        incorrectReaction,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            getPokemonByName(randomFromArray(allEvolvedNames)),
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle("Les méthodes sont :")
            .setDescription(
              `${allAnswers.splice(0, 10).join("\n")}${
                allAnswers.length ? "\net plus..." : ""
              }`
            )
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const whosThePokemonEvolution = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = randomFromArray(pokemonListWithEvolution);
      const evolutions = [
        ...new Set(pokemon.evolutions.map((p) => p.evolvedPokemon)),
      ];
      const answer = new RegExp(
        `^\\W*(${evolutions
          .map((p) => pokemonNameNormalized(p))
          .join("|")})\\b`,
        "i"
      );

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = ["Quelles sont les évolutions de ce Pokémon ?"];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez l'évolution !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            getPokemonByName(randomFromArray(evolutions)),
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle("Les évolutions possibles sont :")
            .setDescription(
              `${evolutions.splice(0, 10).join("\n")}${
                evolutions.length ? "\net plus..." : ""
              }`
            )
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const whosThePokemonPrevolution = () =>
  new Promise((resolve) => {
    (async () => {
      const prevolution = randomFromArray(pokemonListWithEvolution);
      const evolution = randomFromArray(prevolution.evolutions);
      const pokemon = pokemonList.find(
        (p) => p.name == evolution.evolvedPokemon
      );
      const answer = pokemonNameAnswer(prevolution.name);

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = ["Quelles est la pré-évolution de ce Pokémon ?"];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez la pré-évolution !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            prevolution,
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle(`La pré-évolution est : ${prevolution.name}!`)
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const pokemonType = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = getRandomPokemon();
      const types = pokemon.type.map((t) => PokemonType[t]);
      let memeAnswer = "";
      if (types.includes("Vol") && types.includes("Normal")) {
        memeAnswer = "bir[bd]";
      }
      const answer = new RegExp(
        `^\\W*(${types.map((t) => typeNormalized(t)).join("\\W*")}|${types
          .reverse()
          .map((t) => typeNormalized(t))
          .join("\\W*")}${memeAnswer && `|${memeAnswer}`})\\b`,
        "i"
      );

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = ["Quel(s) est(sont) le(s) type(s) de ce Pokémon ?"];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez le(s) type(s) !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            pokemon,
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle(`Le(s) type(s) correct(s): ${types.join(" & ")}!`)
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const pokemonID = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = getRandomPokemon();
      const answer = new RegExp(`^\\W*#?${Math.trunc(+pokemon.id)}\\b`, "i");

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = [
        "Quel est le numéro de ce Pokémon dans le Pokédex national ?",
      ];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const incorrectReaction = (m) => {
        const guessedID = parseFloat(m);
        if (Number.isNaN(guessedID)) {
          return undefined;
        }

        if (guessedID < pokemon.id) {
          return "⬆️";
        }

        if (guessedID > pokemon.id) {
          return "⬇️";
        }
      };

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez le numéro du Pokédex !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        incorrectReaction,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            pokemon,
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle(
              `C'est le numéro ${pokemon.id < 0 ? "-" : ""}#${Math.floor(
                Math.abs(pokemon.id)
              )
                .toString()
                .padStart(3, "0")}!`
            )
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const pokemonRegion = () =>
  new Promise((resolve) => {
    (async () => {
      const pokemon = getRandomPokemon();
      const answer = regionAnswer(GameConstants.Region[pokemon.nativeRegion]);

      let amount = getAmount();

      const shiny = isShiny();
      const female = isFemale(pokemon);

      const description = ["De quelle région vient ce Pokémon ?"];
      description.push(`**+${amount} ${serverIcons.money}**`);

      // If shiny award more coins
      if (shiny) {
        const shiny_amount = getShinyAmount();
        description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
        amount += shiny_amount;
      }

      const base64Image = await getWhosThatPokemonImage(pokemon, female);
      const attachment = new AttachmentBuilder(base64Image, {
        name: "who.png",
      });

      const embed = new EmbedBuilder()
        .setTitle("Trouvez la région d'origine !")
        .setDescription(description.join("\n"))
        .setImage("attachment://who.png")
        .setColor("#3498db");

      resolve({
        embed,
        answer,
        amount,
        shiny,
        files: [attachment],
        end: async (m, e) => {
          const base64ImageFinal = await getWhosThatPokemonFinalImage(
            pokemon,
            shiny,
            female
          );
          const attachmentFinal = new AttachmentBuilder(base64ImageFinal, {
            name: "whoFinal.png",
          });
          const embed = new EmbedBuilder()
            .setTitle(
              `Ce Pokémon vient de ${upperCaseFirstLetter(
                GameConstants.Region[pokemon.nativeRegion]
              )}!`
            )
            .setImage("attachment://whoFinal.png")
            .setColor("#e74c3c");
          m.channel
            .send({ embeds: [embed], files: [attachmentFinal] })
            .catch((...args) => warn("Unable to post quiz answer", ...args));
        },
      });
    })();
  });

const fossilPokemon = () => {
  const [fossil, pokemon] = randomFromArray(
    Object.entries(GameConstants.FossilToPokemon)
  );
  const answer = pokemonNameAnswer(pokemon);

  let amount = getAmount();

  const shiny = isShiny();

  const description = ["Quel Pokémon nait de ce fossile ?"];
  description.push(`||${fossil}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const fossilUrl = `assets/images/breeding/${fossil}.png`;
  const fossilAttachment = new AttachmentBuilder()
    .setFile(fossilUrl)
    .setName("fossil.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le Pokémon !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://fossil.png")
    .setColor("#3498db");

  const pokemonData = getPokemonByName(pokemon);
  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemonData.id
  }.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    files: [fossilAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est ${pokemon} !`)
        .setImage("attachment://pokemon.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [pokemonAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const pokemonFossil = () => {
  const [fossil, pokemonName] = randomFromArray(
    Object.entries(GameConstants.FossilToPokemon)
  );
  const answer = fossilAnswer(fossil);

  const pokemon = pokemonList.find((p) => p.name == pokemonName);

  let amount = getAmount();

  const shiny = isShiny();

  const description = ["De quel fossile est né ce Pokémon ?"];
  description.push(`||${pokemonName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemon.id
  }.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le fossile !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://pokemon.png")
    .setColor("#3498db");

  const fossilUrl = `assets/images/breeding/${fossil}.png`;
  const fossilAttachment = new AttachmentBuilder()
    .setFile(fossilUrl)
    .setName("fossil.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    files: [pokemonAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est le ${fossil} !`)
        .setImage("attachment://fossil.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [fossilAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const startingTown = () => {
  const town = randomFromArray(GameConstants.StartingTowns);
  const region = GameConstants.StartingTowns.findIndex((t) => t == town);
  const answer = townAnswer(town);

  const amount = getAmount();

  const description = [
    `Dans quel lieu commence le joueur dans la région de ${upperCaseFirstLetter(
      GameConstants.Region[region]
    )} ?`,
  ];
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shipUrl = `assets/images/ship.png`;
  const shipAttachment = new AttachmentBuilder()
    .setFile(shipUrl)
    .setName("ship.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le lieu de départ !")
    .setDescription(description.join("\n"))
    .setThumbnail(`attachment://ship.png`)
    .setColor("#3498db");

  const townUrl = `assets/images/towns/${town}.png`;
  const townAttachment = new AttachmentBuilder()
    .setFile(townUrl)
    .setName("town.png");

  return {
    embed,
    answer,
    amount,
    files: [shipAttachment],
    end: async (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Tout commence à ${town} !`)
        .setImage("attachment://town.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [townAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const badgeGymLeader = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = gymLeaderAnswer(gym.leaderName);

  const amount = getAmount();

  const description = ["Quel Champion d'arène offre ce badge ?"];
  description.push(`***Badge ${badge}***`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const badgeUrl = `assets/images/badges/${badge}.png`;
  const badgeAttachment = new AttachmentBuilder()
    .setFile(badgeUrl)
    .setName("badge.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le Champion d'arène !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://badge.png")
    .setColor("#3498db");

  const gymLeaderUrl = `assets/images/npcs/${gym.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  return {
    embed,
    answer,
    amount,
    files: [badgeAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est ${gym.leaderName} !`)
        .setImage("attachment://gymLeader.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [gymLeaderAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const badgeGymLocation = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];
  const answer = townAnswer(gym.town);

  const amount = getAmount();

  const description = [
    "Dans quel lieu se situe l'arène qui récompense ce badge ?",
  ];
  description.push(`***Badge ${badge}***`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const badgeUrl = `assets/images/badges/${badge}.png`;
  const badgeAttachment = new AttachmentBuilder()
    .setFile(badgeUrl)
    .setName("badge.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez la ville de l'arène !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://badge.png")
    .setColor("#3498db");

  const townUrl = `assets/images/towns/${gym.town}.png`;
  const townAttachment = new AttachmentBuilder()
    .setFile(townUrl)
    .setName("town.png");

  return {
    embed,
    answer,
    amount,
    files: [badgeAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est à ${gym.town} !`)
        .setImage("attachment://town.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [townAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const pokemonGymLeader = () => {
  const gym = GymList[randomFromArray(allGyms)];
  const pokemonName = randomFromArray(gym.pokemons).name;
  const pokemon = pokemonList.find((p) => p.name == pokemonName);
  const gyms = allGyms.filter((g) =>
    GymList[g].pokemons.find((p) => p.name == pokemonName)
  );
  const leaders = gyms.map((g) => GymList[g].leaderName);

  const answer = new RegExp(
    `^\\W*(${leaders.map((l) => gymLeaderNormalized(l)).join("|")})\\b`,
    "i"
  );

  let amount = getAmount();

  const description = [
    "Quel Champion d'arène (ou tout membre de la Ligue) utilise ce Pokémon?",
  ];
  description.push(`||${pokemonName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();
  const female = isFemale(pokemon);

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemon.id
  }${female ? "-f" : ""}.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le Champion d'Arène !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://pokemon.png")
    .setColor("#3498db");

  const gymLeaderToShow = GymList[randomFromArray(gyms)];
  const gymLeaderUrl = `assets/images/npcs/${gymLeaderToShow.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    files: [pokemonAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Les Champions possibles sont :`)
        .setDescription(
          `${leaders.splice(0, 10).join("\n")}${
            leaders.length ? "\net plus..." : "!"
          }`
        )
        .setImage("attachment://gymLeader.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [gymLeaderAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const gymLeaderPokemon = () => {
  const gym = GymList[randomFromArray(allGyms)];
  const pokemon = gym.pokemons.map((p) => pokemonNameNormalized(p.name));
  const answer = new RegExp(`^\\W*(${pokemon.join("|")})\\b`, "i");

  let amount = getAmount();

  const description = ["Quel Pokémon est utilisé par ce Champion d'Arène ?"];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const shiny = isShiny();

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ _(shiny)_`);
    amount += shiny_amount;
  }

  const gymLeaderUrl = `assets/images/npcs/${gym.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le Pokémon !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://gymLeader.png")
    .setColor("#3498db");

  const pokemonData = getPokemonByName(randomFromArray(gym.pokemons).name);
  const female = isFemale(pokemonData);

  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemonData.id
  }${female ? "-f" : ""}.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    files: [gymLeaderAttachment],
    end: async (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Les Pokémon sont :`)
        .setDescription(
          `${[...new Set(gym.pokemons.map((p) => p.name))].join("\n")}`
        )
        .setThumbnail("attachment://pokemon.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [pokemonAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const gymLeaderLocation = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const answer = townAnswer(gym.town);

  const amount = getAmount();

  const description = ["Dans quel lieu se trouve l'arène de ce Champion ?"];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const gymLeaderUrl = `assets/images/npcs/${gym.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez la ville de l'arène !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://gymLeader.png")
    .setColor("#3498db");

  const townUrl = `assets/images/towns/${gym.town}.png`;
  const townAttachment = new AttachmentBuilder()
    .setFile(townUrl)
    .setName("town.png");

  return {
    embed,
    answer,
    amount,
    files: [gymLeaderAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est à ${gym.town} !`)
        .setImage("attachment://town.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [townAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const gymLeaderBadge = () => {
  const gym = GymList[randomFromArray(gymsWithBadges)];
  const badge = BadgeEnums[gym.badgeReward];

  const regionRegex = new RegExp(
    `^(${Object.keys(GameConstants.Region)
      .filter((v) => isNaN(+v))
      .join("|")})_`,
    "i"
  );

  const answer = new RegExp(
    `^\\W*${answerNormalized(badge.replace(regionRegex, ""))}\\b`,
    "i"
  );

  const amount = getAmount();
  const description = ["Quel badge est donné par ce Champion d'Arène ?"];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const gymLeaderUrl = `assets/images/npcs/${gym.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le badge !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://gymLeader.png")
    .setColor("#3498db");

  const badgeUrl = `assets/images/badges/${badge}.png`;
  const badgeAttachment = new AttachmentBuilder()
    .setFile(badgeUrl)
    .setName("badge.png");

  return {
    embed,
    answer,
    amount,
    files: [gymLeaderAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`C'est le Badge ${badge} !`)
        .setImage("attachment://badge.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [badgeAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const typeGymLeader = () => {
  const type = randomFromArray(
    enumStrings(PokemonType).filter((t) => t != "None")
  );
  const gyms = allGyms.filter((g) => allGymTypes[g].includes(type));
  const leaders = gyms.map((g) => GymList[g].leaderName);
  const leadersRegex = leaders
    .map((l) => l.replace(/\W/g, ".?").replace(/(Cipher\.\?Admin)/gi, "($1)?"))
    .join("|");
  const answer = new RegExp(`^\\W*(${leadersRegex})\\b`, "i");

  const amount = getAmount();

  const description = ["Quel Champion d'Arène utilise des Pokémon du type :"];
  description.push(`${pokemonTypeIcons[type]} ${type} ?`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le Champion d'Arène !")
    .setDescription(description.join("\n"))
    .setColor("#3498db");

  const gymLeaderToShow = GymList[randomFromArray(gyms)];
  const gymLeaderUrl = `assets/images/npcs/${gymLeaderToShow.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  return {
    embed,
    answer,
    amount,
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Les Champions d'Arène sont :`)
        .setDescription(
          `${leaders.splice(0, 10).join("\n")}${
            leaders.length ? "\net plus..." : "!"
          }`
        )
        .setThumbnail("attachment://gymLeader.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [gymLeaderAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const gymLeaderType = () => {
  const gymTown = randomFromArray(allGyms);
  const gym = GymList[gymTown];
  const mainTypes = allGymTypes[gymTown];
  const answer = new RegExp(`^\\W*(${mainTypes.join("|")})\\b`, "i");

  const amount = getAmount();

  const description = ["Quel est le type des Pokémon de ce Champion d'Arène ?"];
  description.push(`||${gym.leaderName}||`);
  description.push(`**+${amount} ${serverIcons.money}**`);

  const gymLeaderUrl = `assets/images/npcs/${gym.leaderName}.png`;
  const gymLeaderAttachment = new AttachmentBuilder()
    .setFile(gymLeaderUrl)
    .setName("gymLeader.png");

  const embed = new EmbedBuilder()
    .setTitle("Trouvez le type !")
    .setDescription(description.join("\n"))
    .setThumbnail("attachment://gymLeader.png")
    .setColor("#3498db");

  return {
    embed,
    answer,
    amount,
    files: [gymLeaderAttachment],
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Le type est :`)
        .setDescription(
          `${mainTypes
            .map((type) => `${pokemonTypeIcons[type]} ${type}`)
            .join(" ou ")}!`
        )
        .setImage("attachment://gymLeader.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [gymLeaderAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const typeRegionPokemon = () => {
  const randomRegionIndex = Math.floor(Math.random() * regionList.length);
  const selectedRegion = regionList[randomRegionIndex].replace(
    /^[a-z]/,
    (match) => match.toUpperCase()
  );
  const pokemonInRegion = pokemonList.filter(
    (pokemon) => pokemon.nativeRegion === randomRegionIndex
  );
  const randomTypeIndex = randomFromArray(
    randomFromArray(pokemonInRegion).type
  );
  const selectedType = enumStrings(PokemonType).filter(
    (type) => type !== "None"
  )[randomTypeIndex];
  const eligiblePokemon = pokemonList.filter(
    (pokemon) =>
      pokemon.type.includes(randomTypeIndex) &&
      pokemon.nativeRegion === randomRegionIndex &&
      (!pokemon.name.includes("Arceus") || pokemon.name == "Arceus (Normal)") &&
      (!pokemon.name.includes("Silvally") ||
        pokemon.name == "Silvally (Normal)")
  );
  const answer = new RegExp(
    `^\\W*(${eligiblePokemon
      .map((p) => pokemonNameNormalized(p.name))
      .join("|")})\\b`,
    "i"
  );

  let amount = getAmount();

  const description = [
    `Citez un Pokémon de type ${pokemonTypeIcons[selectedType]} ${selectedType} venant de la Région de ${selectedRegion}`,
  ];
  description.push(`**+${amount} ${serverIcons.money}**`);
  const shiny = isShiny();

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ *(shiny)*`);
    amount += shiny_amount;
  }

  const pokemonData = randomFromArray(eligiblePokemon);
  const female = isFemale(pokemonData);

  const eligibleNames = eligiblePokemon.map((p) => p.name);

  const embed = new EmbedBuilder()
    .setTitle("Citez un Pokémon !")
    .setDescription(description.join("\n"))
    .setColor("#7b21a9");

  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemonData.id
  }${female ? "-f" : ""}.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Les Pokémon possibles sont :`)
        .setDescription(
          `${eligibleNames.splice(0, 10).join("\n")}${
            eligibleNames.length ? "\net plus..." : "!"
          }`
        )
        .setThumbnail("attachment://pokemon.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [pokemonAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

const dualTypePokemon = () => {
  const selectedPokemon = randomFromArray(
    pokemonList.filter((p) => p.type.length > 1)
  );

  const types = selectedPokemon.type.map(
    (t) => enumStrings(PokemonType).filter((type) => type !== "None")[t]
  );
  const eligiblePokemon = pokemonList.filter(
    (pokemon) =>
      pokemon.type.every((t) => selectedPokemon.type.includes(t)) &&
      pokemon.type.length == selectedPokemon.type.length
  );

  const answer = new RegExp(
    `^\\W*(${eligiblePokemon
      .map((p) => pokemonNameNormalized(p.name))
      .join("|")})\\b`,
    "i"
  );

  let amount = getAmount();

  const description = [
    `Citez un Pokémon à la fois de type ${pokemonTypeIcons[types[0]]} ${
      types[0]
    } & de type ${pokemonTypeIcons[types[1]]} ${types[1]}`,
  ];
  description.push(`**+${amount} ${serverIcons.money}**`);
  const shiny = isShiny();

  // If shiny award more coins
  if (shiny) {
    const shiny_amount = getShinyAmount();
    description.push(`**+${shiny_amount}** ✨ *(shiny)*`);
    amount += shiny_amount;
  }

  const pokemonData = randomFromArray(eligiblePokemon);
  const female = isFemale(pokemonData);

  const eligibleNames = eligiblePokemon.map((p) => p.name);

  const embed = new EmbedBuilder()
    .setTitle("Citez un Pokémon Double-Type !")
    .setDescription(description.join("\n"))
    .setColor("#b8791d");

  const pokemonUrl = `assets/images/${shiny ? "shiny" : ""}pokemon/${
    pokemonData.id
  }${female ? "-f" : ""}.png`;
  const pokemonAttachment = new AttachmentBuilder()
    .setFile(pokemonUrl)
    .setName("pokemon.png");

  return {
    embed,
    answer,
    amount,
    shiny,
    end: (m, e) => {
      const embed = new EmbedBuilder()
        .setTitle(`Les Pokémon possibles sont :`)
        .setDescription(
          `${eligibleNames.splice(0, 10).join("\n")}${
            eligibleNames.length ? "\net plus..." : "!"
          }`
        )
        .setThumbnail("attachment://pokemon.png")
        .setColor("#e74c3c");
      m.channel
        .send({ embeds: [embed], files: [pokemonAttachment] })
        .catch((...args) => warn("Unable to post quiz answer", ...args));
    },
  };
};

class WeightedOption {
  constructor(option, weight) {
    this.option = option;
    this.weight = weight;
  }
}

const selectWeightedOption = (options_array) => {
  const total = options_array.reduce((acc, o) => acc + o.weight, 0);
  const rand = Math.random() * total;
  let acc = 0;
  return options_array.find((o) => {
    acc += o.weight;
    return acc >= rand;
  });
};

const quizTypes = [
  new WeightedOption(whosThatPokemon, 150),
  // new WeightedOption(pokemonType, 85),
  // new WeightedOption(howDoesThisPokemonEvolve, 80),
  // new WeightedOption(whosThePokemonEvolution, 80),
  // new WeightedOption(whosThePokemonPrevolution, 80),
  // new WeightedOption(pokemonRegion, 45),
  // new WeightedOption(typeRegionPokemon, 45),
  // new WeightedOption(dualTypePokemon, 60),
  // new WeightedOption(pokemonID, 60),
  // new WeightedOption(fossilPokemon, 5),
  // new WeightedOption(pokemonFossil, 5),
  // new WeightedOption(startingTown, 10),
  // new WeightedOption(whatIsThatBerry, 15),
  // new WeightedOption(badgeGymLeader, 10),
  // new WeightedOption(badgeGymLocation, 5),
  // new WeightedOption(pokemonGymLeader, 45),
  // new WeightedOption(typeGymLeader, 30),
  // new WeightedOption(gymLeaderType, 35),
  // new WeightedOption(gymLeaderPokemon, 40),
  // new WeightedOption(gymLeaderLocation, 10),
  // new WeightedOption(gymLeaderBadge, 10),
  // new WeightedOption(___, 1),
];

const getQuizQuestion = async () => {
  const selected = selectWeightedOption(quizTypes);
  return await selected.option();
};

module.exports = {
  getQuizQuestion,
};
