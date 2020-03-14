
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 5; // Up to this version can be saved
const latestVersion = 5; // Might be an experimental version

const newBlankCharacter = function() {
  const version = latestVersion;
  const campaign = {
    powerLevel: 10,
    xpAwarded: 0,
    setting: ""
  };
  const naming = {
    name: "",
    player: "",
    identityType: "none",
    identity: "",
    gender: "",
    age: "",
    heightWeight: "",
    eyesHair: "",
    costume: "",
    groupAffiliation: "",
    baseOfOperations: ""
  };
  const heroPoints = 1;
  const abilities = {};
  for (const statName in statsData) {
    abilities[statName] = {
      entered: 0,
      cost: 0,
      ranks: 0
    };
  }
  const defenses = {};
  const initiative = null;
  for (const defenseName of defenseNames) {
    // These will be populated by defenses
    defenses[defenseName] = {
      base: 0,
      purchased: 0,
      cost: 0,
      ranks: 0
    }
  }
  const skillList = [];
  for (const skillName in skillsData.normalSkills) {
    skillList.push({
      name: skillName,
      ranks: 0,
      isTemplate: false
    });
  }
  const skills = {
    skillList,
    cost: 0
  };
  const advantages = [];
  const powers = [];
  const complications = [
    {
      complicationType: "motivation",
      description: ""
    }
  ];
  const attacks = {
    attackList: [
      {
        type: "unarmed",
        name: "Unarmed",
        attackCheck: 0,
        effectType: "damage",
        resistanceDC: 0
      }
    ]
  };
  return {
    version,
    campaign,
    naming,
    heroPoints,
    abilities,
    defenses,
    initiative,
    advantages,
    skills,
    powers,
    complications,
    attacks
  }
};

const newBlankAdvantage = function() {
  return {
    name: "",
    ranks: null,
    description: ""
  };
};

// New blank skills are ALWAYS template skills since that's the only kind you can add
const newBlankSkill = function() {
  return {
    name: "",
    ranks: 0,
    isTemplate: true,
    specialization: ""
  };
};

const newBlankPower = function() {
  return {
    name: "New Power",
    effect: "",
    description: "",
    extras: [],
    flaws: [],
    ranks: 1,
    cost: 0,
    subpowers: []
  };
};

const newBlankComplication = function() {
  return {
    complicationType: "",
    description: ""
  }
};


/*
 * This modifies the character by finding the (singular) unarmed attack and then
 * setting it correctly.
 */
const recreateUnarmedAttack = function(charsheet) {
  const attackList = charsheet.attacks.attackList;
  const unarmedAttacks = attackList.filter(x => x.type === "unarmed");
  if (unarmedAttacks.length !== 1) {
    throw Error(`Expected exactly 1 unarmed attack; found ${unarmedAttacks.length}`);
  }
  const unarmedAttack = unarmedAttacks[0];
  unarmedAttack.name = "Unarmed"
  unarmedAttack.attackCheck = charsheet.abilities.fighting.ranks;
  unarmedAttack.effectType = "damage";
  unarmedAttack.resistanceDC = charsheet.abilities.strength.ranks;
};
        /*
          Fundamental powers that grant attacks:
           * Damage
              Resist with Toughness (normally)
              Some augment strength; others don't
              - 1 degree: bruised += 1
              - 2 degree: dazed & bruised += 1
              - 3 degree: staggered & bruised += 1
              - 4 degree: incapacitated
           * Affliction
              Resist with Fortitude or Will (normally)
              Effect varies; specified by designer
           * Nullify
              Uses opposed check (nullify vs targeted
              effect or will, whichever is higher)
           * Weaken
              Normal close attack
              Resist with Fortitude or Will.

        */


const upgradeFuncs = {

  upgradeFrom1: function(charsheet) {
    for (const defenseName in charsheet.defenses) {
      delete charsheet.defenses[defenseName].base;
    }
    charsheet.version = 2;
    console.log(`Upgraded character from version 1 to 2.`);
  },

  upgradeFrom2: function(charsheet) {
    for (const advantage of charsheet.advantages) {
      delete advantage.effect;
      delete advantage.isRanked;
      console.log(`have deleted from ${advantage}`); // FIXME: Remove
    }
    charsheet.version = 3;
    console.log(`Upgraded character from version 2 to 3.`);
  },

  upgradeFrom3: function(charsheet) {
    charsheet.heroPoints = 1;
    charsheet.version = 4;
    console.log(`Upgraded character from version 3 to 4.`);
  },

  upgradeFrom4: function(charsheet) {
    charsheet.attacks = {
      attackList: [
        {
          type: "unarmed"
        }
      ]
    };
    recreateUnarmedAttack(charsheet);
    charsheet.version = 5;
    console.log(`Upgraded character from version 4 to 5.`);
  }

};


/*
 * Modifies a charsheet in place to upgrade it one step.
 */
const upgradeFrom = function(charsheet) {
  const oldVersion = charsheet.version;
  const upgradeFunc = upgradeFuncs[`upgradeFrom${oldVersion}`];
  if (upgradeFunc) {
    upgradeFunc(charsheet);
  } else {
    throw Error(`In upgradeVersion(), upgrading from version ${oldVersion} is not supported.`);
  }
};


/*
 * Given a charsheet that might be of an older version, modifies it in place to upgrade it to
 * the most current version.
 */
const upgradeVersion = function(charsheet) {
  if (charsheet.version < latestVersion) {
    upgradeFrom(charsheet)
  }
};

export {
  currentVersion,
  newBlankCharacter,
  newBlankAdvantage,
  newBlankSkill,
  newBlankPower,
  newBlankComplication,
  recreateUnarmedAttack,
  upgradeVersion
};
