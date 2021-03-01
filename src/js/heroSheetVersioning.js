
const statsData = require("@/data/statsData.json");
const defenseNames = require("@/data/defenseNames.json");
const skillsData = require("@/data/skillsData.json");
const standardPowers = require("@/data/standardPowers.json");
const conditionsData = require("@/data/conditionsData.json");
const sensesData = require("@/data/sensesData.json");

const currentVersion = 28; // Up to this version can be saved
const latestVersion = 28; // Might be an experimental version


const fieldsInOrder = ["version", "campaign", "naming", "effortPoints", "abilities", "defenses", "misc",
  "advantages", "equipment", "skills", "powers", "complications", "background", "attacks", "senses", "activeEffects",
  "constraintViolations", "status", "allies", "sharing"];

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
  // -- Just in case, if anything isn't in the preferred order add it at the end --
  for (const field in original) {
    if (!(field in charsheet)) {
      charsheet[field] = original[field];
    }
  }
};


const getRandomValues = function(){
  if (typeof(window) !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    return x => window.crypto.getRandomValues(x);
  } else {
    const getRandomValues = require('get-random-values');
    return getRandomValues
  }
}();


/*
 * Generate a random element ID.
 *
 * A-Z0-9 is 36.
 *
 * 32 is 5 bits. So we can use 32 values as follows:
 * ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
 * ABCDEFG  JKLMN PQRSTUVWXYZ 123456789  (0 and O are easily confused; HI is used as a prefix)
 * So "HI" followed by 7 characters chosen at random from "ABCDEFGJKLMNPQRSTUVWXYZ123456789"
 */
const newHsid = function() {
  const allowedCharacters = "ABCDEFGJKLMNPQRSTUVWXYZ123456789"; // 32 chars long
  const randomData = new Uint8Array(7);
  getRandomValues(randomData);
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
  const misc = {
    initiative: null,
    isMindlessConstruct: false,
    isImmobileConstruct: false
  };
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
      hsid: newHsid(),
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
        effectType: "damage",
        range: "close",
        scope: "singleTarget",
        ranks: 0,
        attackCheckAdjustment: 0
      },
      {
        hsid: newHsid(),
        updater: "ThrownAttackUpdater",
        name: "Thrown Object",
        effectType: "damage",
        range: "ranged",
        scope: "singleTarget",
        ranks: 0,
        attackCheckAdjustment: 0
      }
    ]
  };
  const senses = defaultSenses();
  const activeEffects = {};
  const constraintViolations = {};
  const status = {
    conditions: blankConditions(),
    damagePenalty: 0,
  };
  const allies = [];
  const sharing = {
    isPublic: false,
  };
  return {
    version,
    campaign,
    naming,
    effortPoints,
    abilities,
    defenses,
    misc,
    advantages,
    equipment,
    skills,
    powers,
    complications,
    background,
    attacks,
    senses,
    activeEffects,
    constraintViolations,
    status,
    allies,
    sharing,
  }
};


const blankConditions = function() {
  const result = {};
  for (const condition in conditionsData.conditions) {
    result[condition] = {
      "active": false,
      "selected": false,
      "superseded": false
    };
  }
  return result;
}

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
    subpowers: [],
    extended: {},
    activation: {
      activationStatus: "on",
      ranks: 0
    },
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
 * Add a sense to a senses entry from a character.
 */
const addSense = function(senses, senseTypeName, sense) {
  // -- Create Sense Type if it doesn't exist --
  let senseTypeEntry = senses[senseTypeName];
  if (senseTypeEntry === undefined) {
    senseTypeEntry = {
      name: senseTypeName,
      senses: [],
      qualities: [],
    };
    senses[senseTypeName] = senseTypeEntry;
  }
  // -- Add the new sense --
  senseTypeEntry.senses.push(sense);
}


/*
 * Creates and returns a new set of the default senses every character comes with.
 */
const defaultSenses = function() {
  const result = {};
  for (const senseData of Object.values(sensesData.senses)) {
    if (senseData.isInherentSense) {
      const newSense = {
        name: senseData.name,
        hsid: newHsid(),
        qualities: senseData.defaultQualities.map(x => {
          return { name: x }
        }),
      };
      addSense(result, senseData.senseType, newSense);
    }
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
 * null if there isn't one. It searches everywhere that a feature might appear:
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
 * Used internally in findContainingArrayByHsid.
 */
class WillNotFindException extends Error {
}


/*
 * Some features (powers) are found inside other array powers. This is used to work one's way up
 * through the hierarchy. It is passed the hsid of a feature and if that feature is a subpower of
 * some array it returns the array feature that contains it. If that feature is NOT a subpower of
 * some array then this returns null.
 */
const findContainingArrayByHsid = function(charsheet, hsid) {
  // --- Define mutually recursive search helpers ---

  // If the power is the parent of the hsid OR contains it, return the parent; otherwise return null.
  function checkPowerAndSubpowers(power) {
    if (power.hsid === hsid) {
      // found the power itself WITHOUT encountering a parent first. We can quit now.
      throw new WillNotFindException();
    }
    if (power.subpowers.length === 0) {
      return null; // clearly not ANYONE's parent
    }
    for (const subpower of power.subpowers) {
      if (subpower.hsid === hsid) {
        return power; // This is the parent!
      }
    }
    return checkInPowerList(power.subpowers); // Recurse
  }

  // If the powerList contains a parent of the hsid return it; otherwise return null.
  function checkInPowerList(powerList) {
    for (const power of powerList) {
      const possibleResult = checkPowerAndSubpowers(power);
      if (possibleResult !== null) {
        return possibleResult;
      }
    }
    return null;
  }

  try {

    // --- Search in powers ---
    const featureInPowers = checkInPowerList(charsheet.powers);
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

  } catch(err) {
    if (err instanceof WillNotFindException) {
      // We found the power without finding it's parent. We can go ahead and return null.
      return null;
    } else {
      throw err; // Anything else we don't actually want to catch
    }
  }
}


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


const hsidFieldNames = ["hsid", "allyHsid", "attackHsid", "powerHsid", "skillHsid", "advantageHsid"];

/*
 * This function goes through an entire charsheet and creates a duplicate of it which has
 * all the same values EXCEPT that th HSIDs have all been re-assigned. It is used when
 * duplicating a charsheet.
 *
 * IMPLEMENTATION NOTE: the best way to do this would be to use the schema to scan through and
 * identify all the HSID fields. But the shortcut being used instead is a list ("hsidFieldNames")
 * of field names -- all of which contain HSIDs and all HSIDs are in a field of this name.
 */
const renumberHsids = function(charsheet) {
  const hsidReplacements = {}; // a mapping from old HSID to new HSID
  const renumberField = function(value) {
    const type = typeof(value);
    if (type === "string" || type === "object" && value instanceof String) {
      return value;
    } else if (type === "number") {
      return value;
    } else if (type === "boolean") {
      return value;
    } else if (type === "object" && value === null) {
      return value;
    } else if (type === "object" && Array.isArray(value)) {
      return renumberArray(value);
    } else if (type === "object") {
      return renumberObject(value);
    }
  }
  const renumberObject = function(obj) {
    const newObj = {};
    for (const field in obj) {
      const value = obj[field];
      if (hsidFieldNames.includes(field)) {
        const previousReplacement = hsidReplacements[value];
        let replacement;
        if (previousReplacement === undefined) {
          replacement = newHsid();
          hsidReplacements[value] = replacement;
        } else {
          replacement = previousReplacement;
        }
        newObj[field] = replacement;
      } else {
        newObj[field] = renumberField(value);
      }
    }
    return newObj;
  };
  const renumberArray = function(array) {
    const newArray = [];
    for (const value of array) {
      newArray.push(renumberField(value));
    }
    return newArray;
  }
  return renumberObject(charsheet);
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
  },

  upgradeFrom16: function(charsheet) {
    charsheet.misc = {
      initiative: charsheet.initiative,
      isMindlessConstruct: false,
      isImmobileConstruct: false
    };
    delete charsheet.initiative;
    for (const statName in statsData) {
      delete charsheet.abilities[statName].cost;
    }
    charsheet.version = 17;
  },

  upgradeFrom17: function(charsheet) {
    for (const complication of charsheet.complications) {
      if (complication.hsid === undefined) {
        complication.hsid = newHsid();
      }
    }
    for (const skill of charsheet.skills.skillList) {
      if (!skill.isTemplate) {
        delete skill.hsid;
      }
    }
    // Given a patchFunc that modifies objects in place AND returns true to keep and
    // false to delete, this applies it to each element in list and returns the
    // result
    const applyPatchToList = function(patchFunc, list) {
      return list.reduce((accumulate, item) => {
        if (patchFunc(item)) {
          accumulate.push(item);
        }
        return accumulate;
      }, []);
    }
    const patchAdvantage = function(advantage) {
      delete advantage.effect;
      delete advantage.isRanked;
      return true;
    }
    const patchModifier = function(modifier) {
      if (modifier.modifierSource === undefined) {
        modifier.modifierSource = "standard";
      }
      return true;
    }
    const patchFeature = function(power) {
      power.extras = applyPatchToList(patchModifier, power.extras);
      power.flaws = applyPatchToList(patchModifier, power.flaws);
      delete power.flats;
      if (power.baseCost === null) {
        delete power.baseCost;
      }
      power.subpowers = applyPatchToList(patchFeature, power.subpowers);
      if (power.effect in standardPowers) {
        return true;
      } else {
        return false;
      }
    };
    const patchItem = function(item) {
      if (item.feature) {
        const shouldKeep = patchFeature(item.feature);
        if (!shouldKeep) {
          delete item.feature;
        }
      }
      return true;
    };
    const patchAttack = function(attack) {
      if (attack.updater.startsWith("updaters_")) {
        attack.updater = attack.updater.substring(9);
      }
      return true;
    };
    const patchActiveEffect = function(activeEffect) {
      if (activeEffect.description === undefined) {
        activeEffect.description = "";
      }
      return true;
    };
    charsheet.advantages = applyPatchToList(patchAdvantage, charsheet.advantages)
    charsheet.powers = applyPatchToList(patchFeature, charsheet.powers);
    charsheet.equipment = applyPatchToList(patchItem, charsheet.equipment);
    charsheet.attacks.attackList = applyPatchToList(patchAttack, charsheet.attacks.attackList);
    for (const key in charsheet.activeEffects) {
      charsheet.activeEffects[key] = applyPatchToList(patchActiveEffect, charsheet.activeEffects[key]);
    }
    charsheet.version = 18;
  },

  upgradeFrom18: function(charsheet) {
    charsheet.status = {
      "conditions": blankConditions()
    };
    charsheet.version = 19;
  },

  upgradeFrom19: function(charsheet) {
    charsheet.attacks.attackList.forEach(attack => {
      // For all PowerAttacks, set the updater to the new common parent class
      if (attack.updater.endsWith("PowerAttackUpdater")) {
        attack.updater = "PowerAttackUpdater";
      }
      // Now, wipe out ALL fields except for hsid, updater, and powerHsid". The updater will re-populate them.
      for (const field in attack) {
        if (!["hsid", "updater", "powerHsid"].includes(field)) {
          delete attack[field];
        }
      }
    });
    charsheet.attacks.attackList.push(
      {
        hsid: newHsid(),
        updater: "ThrownAttackUpdater",
        name: "Thrown Object",
        effectType: "damage",
        range: "ranged",
        scope: "singleTarget",
        ranks: 0,
        strengthBased: true,
        attackCheckAdjustment: 0
      }
    );
    charsheet.version = 21;
  },

  upgradeFrom20: function(charsheet) {
    charsheet.attacks.attackList.forEach(attack => {
      // Wipe out ALL fields except for hsid, updater, and powerHsid". The updater will re-populate them.
      for (const field in attack) {
        if (!["hsid", "updater", "powerHsid"].includes(field)) {
          delete attack[field];
        }
      }
    });
    charsheet.version = 21;
  },

  upgradeFrom21: function(charsheet) {
    charsheet.sharing = { isPublic: false };
    charsheet.version = 22;
  },

  upgradeFrom22: function(charsheet) {
    charsheet.status.damagePenalty = 0;
    charsheet.version = 23;
  },

  upgradeFrom23: function(charsheet) {
    const upgradeFeature = function(feature) {
      if (feature === undefined || feature === null) {
        return;
      }
      delete feature.effectDescription;
      delete feature.baseCost;
      feature.extended = {};
      if (feature.subpowers) {
        feature.subpowers.forEach(upgradeFeature);
      }
    };
    charsheet.powers.forEach(upgradeFeature);
    charsheet.equipment.forEach(x => upgradeFeature(x.feature));
    charsheet.version = 24;
  },

  upgradeFrom24: function(charsheet) {
    charsheet.senses = defaultSenses();
    charsheet.version = 25;
  },

  upgradeFrom25: function(charsheet) {
    // -- new activation field in every feature ---
    const upgradeFeature = function(feature) {
      if (feature === undefined || feature === null) {
        return;
      }
      feature.activation = {
        activationStatus: "on",
        ranks: 0
      }
      if (feature.subpowers) {
        feature.subpowers.forEach(upgradeFeature);
      }
    };
    charsheet.powers.forEach(upgradeFeature);
    charsheet.equipment.forEach(x => upgradeFeature(x.feature));
    // -- attacks gain an isActive field --
    charsheet.attacks.attackList.forEach(attack => {
      attack.isActive = true;
    });
    // -- new code gives better names for adjustments. Let the user know that --
    for (const activeEffectType of Object.values(charsheet.activeEffects)) {
      for (const activeEffect of activeEffectType) {
        if (activeEffect.description === "Protection") {
          activeEffect.description = "Re-create power to see effect type."
        }
      }
    }
    // -- version number --
    charsheet.version = 26;
  },

  upgradeFrom26: function(charsheet) {
    // -- the Affliction feature now has extended data --
    const upgradeFeature = function(feature) {
      if (feature === undefined || feature === null) {
        return;
      }
      if (feature.effect === "Affliction") {
        feature.extended = {
          "conditionsApplied": [ [ "", "", "" ] ],
          "alternateResistance": "",
          "resistWith": ""
        };
      }
      if (feature.subpowers) {
        feature.subpowers.forEach(upgradeFeature);
      }
    };
    charsheet.powers.forEach(upgradeFeature);
    charsheet.equipment.forEach(x => upgradeFeature(x.feature));
    // -- version number --
    charsheet.version = 27;
  },

  upgradeFrom27: function(charsheet) {
    const upgradeFeature = function(feature) {
      if (feature === undefined || feature === null || !feature.effect) {
        return;
      }
      const powerLayout = standardPowers[feature.effect].powerLayout;
      if (powerLayout === "selection") {
        if (feature.extended.selectedFeatures === undefined) {
          // we don't know what was intended to be selected; make it "nothing" as a starting point
          feature.extended["selectedFeatures"] = [];
        }
      }
      if (feature.subpowers) {
        feature.subpowers.forEach(upgradeFeature);
      }
    }
    charsheet.powers.forEach(upgradeFeature);
    charsheet.equipment.forEach(x => upgradeFeature(x.feature));
    charsheet.version = 28;
  },

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

// Using the older syntax here to support calling it from a node-based script
module.exports = {
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
  findContainingArrayByHsid,
  findAdvantageByHsid,
  findSkillByHsid,
  findAllyByHsid,
  newHsid,
  renumberHsids,
  upgradeVersion
};
