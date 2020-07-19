
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 15; // Up to this version can be saved
const latestVersion = 16; // Might be an experimental version


const fieldsInOrder = ["version", "campaign", "naming", "effortPoints", "abilities", "defenses",
  "initiative", "advantages", "equipment", "skills", "powers", "complications", "background", "attacks",
  "activeEffects", "constraintViolations", "allies"];

/*
 * Given a charsheet, this re-orders the fields so they are in the preferred order.
 */
const sortFields = function(charsheet) {
  // -- Make a shallow copy and delete the fields --
  const original = {};
  for (const field in charsheet) {
    original[field] = charsheet[field];
    delete charsheet[field];
  }
  // -- Re-insert in order --
  for (const field of fieldsInOrder) {
    if (field in original) {
      charsheet[field] = original[field];
    }
  }
  // -- Just in case, if anything isn't in the preferred order add it --
  for (const field in original) {
    if (!(field in charsheet)) {
      charsheet[field] = original[field];
    }
  }
};


/*
 * Generate a random element ID.
 *
 * A-Z0-9 is 36.
 *
 * 32 is 5 bits. So we can use 32 values as follows:
 * ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
 * ABCDEFG  JKLMN PQRSTUVWXYZ 123456789  (0 and O are easily confused; HI is used as a prefix)
 * So "ID" followed by 7 characters chosen at random from "ABCDEFGJKLMNPQRSTUVWXYZ123456789"
 */
const newHsid = function() {
  const allowedCharacters = "ABCDEFGJKLMNPQRSTUVWXYZ123456789"; // 32 chars long
  const randomData = new Uint8Array(7);
  window.crypto.getRandomValues(randomData);
  const characters = Array.from(randomData).map(x => allowedCharacters[x % 32]);
  return "HI" + characters.join("");
};


const newBlankCharacter = function(developerMode) {
  const version = developerMode ? latestVersion : currentVersion;
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
  const effortPoints = 1;
  const abilities = {};
  for (const statName in statsData) {
    abilities[statName] = {
      entered: 0,
      cost: 0,
      ranks: 0
    };
  }
  const defenses = {};
  for (const defenseName of defenseNames) {
    // These will be populated by defenses
    defenses[defenseName] = {
      base: 0,
      purchased: 0,
      cost: 0,
      ranks: 0
    }
  }
  const initiative = null;
  const advantages = [];
  const equipment = [];
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
  const powers = [];
  const complications = [
    {
      complicationType: "motivation",
      description: ""
    }
  ];
  const background = "";
  const attacks = {
    attackList: [
      {
        hsid: newHsid(),
        updater: "UnarmedAttackUpdater",
        name: "Unarmed",
        attackCheck: 0,
        effectType: "damage",
        resistanceDC: 0
      }
    ]
  };
  const activeEffects = {};
  const constraintViolations = {};
  const allies = [];
  return {
    version,
    campaign,
    naming,
    effortPoints,
    abilities,
    defenses,
    initiative,
    advantages,
    equipment,
    skills,
    powers,
    complications,
    background,
    attacks,
    activeEffects,
    constraintViolations,
    allies,
  }
};

const newBlankAdvantage = function() {
  return {
    name: "",
    hsid: newHsid(),
    ranks: null,
    description: ""
  };
};

/*
  NOTE: The singular is "item"; the plural is "equipment".

  Equipment.source takes on the following values:
   * "unselected" -- means the user hasn't chosen and this item is invalid
   * "standardEquipment" -- means it comes from standardEquipment.json
   * "custom" -- means it was custom-designed by the user
*/

const newBlankEquipment = function() {
  return {
    hsid: newHsid(),
    name: "",
    cost: NaN,
    source: "unselected",
    feature: null
  };
}

// New blank skills are ALWAYS template skills since that's the only kind you can add
const newBlankSkill = function() {
  return {
    name: "",
    hsid: newHsid(),
    ranks: 0,
    isTemplate: true
  };
};

const STARTING_POWER_NAME = "New Power";

const newBlankPower = function() {
  return {
    name: STARTING_POWER_NAME,
    hsid: newHsid(),
    effect: "",
    description: "",
    extras: [],
    flaws: [],
    ranks: 1,
    cost: NaN,
    effectDescription: "",
    baseCost: NaN,
    subpowers: []
  };
};

const newBlankComplication = function() {
  return {
    hsid: newHsid(),
    complicationType: "",
    description: ""
  }
};


/*
 * Creates an adjustment from the relevant data.
 *
 * updater: the name of the updater type
 * description: the text description to display
 * value: the number giving the amount of the update
 * otherFields: an object containing additional fields to
 *   be added to the adjustment object. The particular
 *   fields used will be specific to the updater used.
 */
const newAdjustment = function(description, value, otherFields) {
  const result = {
    hsid: newHsid(),
    description: description,
    value: value,
    isActive: true
  };
  for (const fieldName in otherFields) {
    result[fieldName] = otherFields[fieldName];
  }
  return result;
}

/*
 * The list of advantages that work like allies. Should perhaps move to the data files.
 */
const allyAdvantages = ["Minion", "Sidekick"];
const allyAdvantagesLowercase = allyAdvantages.map(x => x.toLowerCase());

/*
 * This will create a new ally of the specified type, adds it to the
 * charsheet, and returns it.
 */
const makeNewAlly = function(charsheet, type) {
  if (!allyAdvantagesLowercase.includes(type)) {
    throw new Error(`Allies of type "${type} not supported.`);
  }
  const ally = {
    hsid: newHsid(),
    type: type,
    charsheet: newBlankCharacter(),
  }
  charsheet.allies.push(ally);
  return ally;
}


/*
 * Given a charsheet and an hsid in it, returns the feature with that hsid or
 * null if there isn't one. It searches everwhere that a feature might appear:
 * in power but also other places like equipment.
 *
 * DESIGN NOTES:
 *  It might benefit from some smart caching, but I haven't bothered yet
 */
const findFeatureByHsid = function(charsheet, hsid) {
  // --- Define mutually recursive search helpers ---
  function checkPowerAndSubpowers(power) {
    if (power.hsid === hsid) {
      return power;
    }
    if (power.subpowers) {
      const recursiveResult = findByHsidInPowerList(power.subpowers);
      if (recursiveResult !== null) {
        return recursiveResult;
      }
    }
    return null;
  }
  function findByHsidInPowerList(powerList) {
    for (const power of powerList) {
      const possibleResult = checkPowerAndSubpowers(power);
      if (possibleResult !== null) {
        return possibleResult;
      }
    }
    return null;
  }
  // --- Search in powers ---
  const featureInPowers = findByHsidInPowerList(charsheet.powers);
  if (featureInPowers !== null) {
    return featureInPowers;
  }
  // --- Search in equipment ---
  for (const item of charsheet.equipment) {
    const feature = item.feature;
    if (feature) {
      const possibleResult = checkPowerAndSubpowers(feature);
      if (possibleResult !== null) {
        return possibleResult;
      }
    }
  }
  // --- Not found ---
  return null;
};

/*
 * Design Notes: see findFeatureByHsid. Maybe we should build "findByHsid".
 */
const findAdvantageByHsid = function(charsheet, hsid) {
  for (const advantage of charsheet.advantages) {
    if (advantage.hsid === hsid) {
      return advantage;
    }
  }
  return null;
};

/*
 * Design Notes: see findFeatureByHsid. Maybe we should build "findByHsid".
 */
const findSkillByHsid = function(charsheet, hsid) {
  for (const skill of charsheet.skills.skillList) {
    if (skill.isTemplate && skill.hsid === hsid) {
      return skill;
    }
  }
  return null;
};


/*
 * Returns the ally that has the given hsid, or undefined if none does.
 */
const findAllyByHsid = function(charsheet, hsid) {
  return charsheet.allies.find(x => x.hsid === hsid);
}


/*
 * This modifies the character by finding the (singular) unarmed attack and then
 * setting it correctly.
 *
 * NOTE: This is now replaced by an updater so it exists only for upgrade purposes.
 */
const _recreateUnarmedAttack = function(charsheet) {
  const attackList = charsheet.attacks.attackList;
  const unarmedAttacks = attackList.filter(x => x.type === "unarmed");
  if (unarmedAttacks.length !== 1) {
    throw Error(`Expected exactly 1 unarmed attack; found ${unarmedAttacks.length}`);
  }
  const unarmedAttack = unarmedAttacks[0];
  unarmedAttack.name = "Unarmed";
  unarmedAttack.attackCheck = charsheet.abilities.fighting.ranks;
  unarmedAttack.effectType = "damage";
  unarmedAttack.resistanceDC = charsheet.abilities.strength.ranks;
};


const upgradeFuncs = {

  upgradeFrom1: function(charsheet) {
    for (const defenseName in charsheet.defenses) {
      delete charsheet.defenses[defenseName].base;
    }
    charsheet.version = 2;
  },

  upgradeFrom2: function(charsheet) {
    for (const advantage of charsheet.advantages) {
      delete advantage.effect;
      delete advantage.isRanked;
    }
    charsheet.version = 3;
  },

  upgradeFrom3: function(charsheet) {
    charsheet.heroPoints = 1;
    charsheet.version = 4;
  },

  upgradeFrom4: function(charsheet) {
    charsheet.attacks = {
      attackList: [
        {
          type: "unarmed"
        }
      ]
    };
    _recreateUnarmedAttack(charsheet);
    charsheet.version = 5;
  },

  upgradeFrom5: function(charsheet) {
    charsheet.effortPoints = charsheet.heroPoints;
    delete charsheet.heroPoints;
    charsheet.version = 6;
  },

  upgradeFrom6: function(charsheet) {
    for (const advantage of charsheet.advantages) {
      advantage.hsid = newHsid();
    }
    for (const skill of charsheet.skills.skillList) {
      skill.hsid = newHsid();
    }
    for (const complication of charsheet.complications) {
      complication.hsid = newHsid();
    }
    const upgradePowerList = function(powerList) {
      for (const power of powerList) {
        power.hsid = newHsid();
        if (power.subpowers) {
          upgradePowerList(power.subpowers);
        }
      }
    };
    upgradePowerList(charsheet.powers);
    charsheet.version = 7;
  },

  upgradeFrom7: function(charsheet) {
    for (const attack of charsheet.attacks.attackList) {
      if (attack.type === "unarmed") {
        attack.type = "UnarmedAttackUpdater";
      }
    }
    charsheet.version = 8;
  },

  upgradeFrom8: function(charsheet) {
    for (const attack of charsheet.attacks.attackList) {
      attack.updater = attack.type;
      delete attack.type;
      if (attack.hsid) {
        attack.powerHsid = attack.hsid;
        delete attack.hsid;
      }
      attack.hsid = newHsid();
    }
    charsheet.version = 9;
  },

  upgradeFrom9: function(charsheet) {
    charsheet.activeEffects = {};
    charsheet.version = 10;
  },

  upgradeFrom10: function(charsheet) {
    charsheet.equipment = [];
    charsheet.version = 11;
  },

  upgradeFrom11: function(charsheet) {
    charsheet.background = "";
    charsheet.version = 12;
  },

  upgradeFrom12: function(charsheet) {
    for (const activeEffectList of Object.values(charsheet.activeEffects)) {
      for (const activeEffect of activeEffectList) {
        if (!("isActive" in activeEffect)) {
          activeEffect.isActive = true;
        }
      }
    }
    charsheet.version = 13;
  },

  upgradeFrom13: function(charsheet) {
    for (const activeEffectList of Object.values(charsheet.activeEffects)) {
      for (const activeEffect of activeEffectList) {
        if ("updater" in activeEffect && activeEffect.updater.startsWith("updaters_")) {
          activeEffect.updater = activeEffect.updater.substring(9);
        }
      }
    }
    charsheet.version = 14;
  },

  upgradeFrom14: function(charsheet) {
    charsheet.allies = [];
    charsheet.version = 15;
  },

  upgradeFrom15: function(charsheet) {
    charsheet.constraintViolations = {};
    charsheet.version = 16;
  }
};


/*
 * Modifies a charsheet in place to upgrade it one (or more) step(s).
 */
const upgradeFrom = function(charsheet) {
  const oldVersion = charsheet.version;
  const upgradeFunc = upgradeFuncs[`upgradeFrom${oldVersion}`];
  if (upgradeFunc) {
    upgradeFunc(charsheet);
    console.log(`Upgraded character from version ${oldVersion} to ${charsheet.version}.`);
  } else {
    throw Error(`In upgradeVersion(), upgrading from version ${oldVersion} is not supported.`);
  }
};


/*
 * Given a charsheet that might be of an older version, modifies it in place to upgrade it to
 * the most current version.
 */
const upgradeVersion = function(charsheet, developerMode) {
  const targetVersion = developerMode ? latestVersion : currentVersion;
  while (charsheet.version < targetVersion) {
    upgradeFrom(charsheet)
  }
  sortFields(charsheet);
  if (charsheet.allies) {
    for (const ally of charsheet.allies) {
      upgradeVersion(ally.charsheet, developerMode);
    }
  }
};

export {
  STARTING_POWER_NAME,
  currentVersion,
  newBlankCharacter,
  newBlankAdvantage,
  newBlankEquipment,
  newBlankSkill,
  newBlankPower,
  newBlankComplication,
  newAdjustment,
  allyAdvantages,
  allyAdvantagesLowercase,
  makeNewAlly,
  findFeatureByHsid,
  findAdvantageByHsid,
  findSkillByHsid,
  findAllyByHsid,
  newHsid,
  upgradeVersion
};
