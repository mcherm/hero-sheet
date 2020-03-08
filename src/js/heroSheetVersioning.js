
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 3;

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
  const complications = [
    {
      complicationType: "motivation",
      description: ""
    }
  ];
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

const newBlankAdvantage = function() {
  return {
    name: "",
    ranks: null,
    description: ""
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

const newBlankComplication = function() {
  return {
    complicationType: "",
    description: ""
  }
};


const upgradeFrom1 = function(charsheet) {
  for (const defenseName in charsheet.defenses) {
    delete charsheet.defenses[defenseName].base;
  }
  charsheet.version = 2;
  console.log(`Upgraded character from version 1 to 2.`);
};

const upgradeFrom2 = function(charsheet) {
  for (const advantage of charsheet.advantages) {
    delete advantage.effect;
    delete advantage.isRanked;
    console.log(`have deleted from ${advantage}`); // FIXME: Remove
  }
  charsheet.version = 3;
  console.log(`Upgraded character from version 2 to 3.`);
};

/*
 * Modifies a charsheet in place to upgrade it one step.
 */
const upgradeFrom = function(charsheet) {
  const oldVersion = charsheet.version;
  if (oldVersion === 1) {
    upgradeFrom1(charsheet);
  } else if (oldVersion === 2) {
      upgradeFrom2(charsheet);
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
  newBlankAdvantage,
  newBlankPower,
  newBlankComplication,
  upgradeVersion
};
