
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 2;

const newBlankCharacter = function() {
  const version = currentVersion;
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
  const abilities = {};
  for (const statName in statsData) {
    abilities[statName] = {
      entered: 0,
      cost: null,
      ranks: null
    };
  }
  const defenses = {};
  const initiative = null;
  for (const defenseName of defenseNames) {
    // These will be populated by defenses
    defenses[defenseName] = {
      base: null,
      purchased: 0,
      cost: null,
      ranks: null
    }
  }
  const skillList = {};
  for (const skillName in skillsData.normalSkills) {
    skillList[skillName] = {
      ranks: 0
    };
  }
  const skills = {
    skillList,
    cost: 0
  };
  const advantages = [];
  const powers = [];
  const complications = [];
  return {
    version,
    campaign,
    naming,
    abilities,
    defenses,
    initiative,
    advantages,
    skills,
    powers,
    complications
  }
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


const upgradeFrom1 = function(charsheet) {
  for (const defenseName in charsheet.defenses) {
    delete charsheet.defenses[defenseName].base;
  }
  charsheet.version = 2;
  console.log(`Upgraded character from version 1 to 2.`);
};


/*
 * Modifies a charsheet in place to upgrade it one step.
 */
const upgradeFrom = function(charsheet) {
  const oldVersion = charsheet.version;
  if (oldVersion === 1) {
    upgradeFrom1(charsheet);
  } else {
    throw Error(`In upgradeVersion(), upgrading from version ${oldVersion} is not supported.`);
  }
  return charsheet;
};


/*
 * Given a charsheet that might be of an older version, modifies it in place to upgrade it to
 * the most current version.
 */
const upgradeVersion = function(charsheet) {
  if (charsheet.version < currentVersion) {
    upgradeFrom(charsheet)
  }
};

export {
  newBlankCharacter,
  newBlankPower,
  upgradeVersion
};
