
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");


const newBlankCharacter = function() {
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
      ranks: 0,
      skillRoll: null
    };
  }
  const skills = {
    skillList,
    totalRanks: null,
    cost: 0
  };
  const advantages = [];
  const powers = [];
  const complications = [];
  return {
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

export {newBlankCharacter, newBlankPower};
