
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 7; // Up to this version can be saved
const latestVersion = 7; // Might be an experimental version


const fieldsInOrder = ["version", "campaign", "naming", "effortPoints", "abilities", "defenses",
  "initiative", "advantages", "skills", "powers", "complications", "attacks"];

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
    effortPoints,
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
    hsid: newHsid(),
    ranks: null,
    description: ""
  };
};

// New blank skills are ALWAYS template skills since that's the only kind you can add
const newBlankSkill = function() {
  return {
    name: "",
    hsid: newHsid(),
    ranks: 0,
    isTemplate: true,
    specialization: ""
  };
};

const newBlankPower = function() {
  return {
    name: "New Power",
    hsid: newHsid(),
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
    hsid: newHsid(),
    complicationType: "",
    description: ""
  }
};


/*
 * Given a charsheet and an hsid in it, returns the power with that hsid or
 * null if there isn't one.
 *
 * DESIGN NOTES:
 *  1. it probably shouldn't just be for powers
 *  2. it might need some smart caching
 *  3. this will do for now while I clean up other stuff
 */
const findPowerByHisd = function(charsheet, hsid) {
  function findByHsidRecursive(powerList) {
    for (const power of powerList) {
      if (power.hsid === hsid) {
        return power;
      }
      if (power.subpowers) {
        const recursiveResult = findByHsidRecursive(power.subpowers);
        if (recursiveResult !== null) {
          return recursiveResult;
        }
      }
    }
    return null;
  }
  return findByHsidRecursive(charsheet.powers);
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


/*
 * A parent class for all updaters. An Updater is a class, each instance of
 * which monitors certain fields and updates other fields in the charsheet.
 * An example would be an updater for creating an attack.
 */
class Updater {
  constructor(vm, charsheet) {
    this.charsheet = charsheet;
    this.activeWatches = [];
  }

}

class DamagePowerAttackUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet);
    this.power = newUpdaterEvent.power;
    this.theAttack = this.findOrCreateTheAttack();
    const cancelFunction = this.createWatch(vm);
    this.activeWatches.push(cancelFunction);
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateTheAttack() {
    const updaterName = this.constructor.name;
    const attackList = this.charsheet.attacks.attackList;
    const matchingAttacks = attackList.filter(
      x => x.type === updaterName && x.hsid === this.power.hsid
    );
    if (matchingAttacks.length > 1) {
      throw Error(`Multiple attacks of type ${updaterName} with key ${this.power.name}`);
    } else if (matchingAttacks.length === 1) {
      return matchingAttacks[0];
    } else {
      const newAttack = {
        type: updaterName,
        hsid: this.power.hsid,
        name: this.power.name,
        attackCheck: this.charsheet.abilities.fighting.ranks,
        effectType: "damage",
        resistanceDC: this.power.ranks
      };
      attackList.push(newAttack);
      return newAttack;
    }
  }

  /*
   * Initiates the watch that drives this updater. In the future I will figure out
   * how to generalize this; right now it is all specific to DamagePowerAttackUpdater.
   * It returns the cancel function for the watch.
   */
  createWatch(vm) {
    const power = this.power;
    const charsheet = this.charsheet;
    const theAttack = this.theAttack;
    const activeWatches = this.activeWatches;
    const cancelFunction = vm.$watch(function() {
      // -- Test Function for Watch --
      console.log(`Test Function for the watch runs now`); // FIXME: Remove
      return {
        identity: {
          powerHsid: power.hsid,
          powerEffect: power.effect
        },
        calculations: {
          fighting: charsheet.abilities.fighting.ranks,
          powerRanks: power.ranks,
          powerName: power.name
        }
      }
    }, function(newValue, oldValue) {
      // -- Callback Function --
      console.log(`Within New Watch: ${JSON.stringify(newValue)}, ${JSON.stringify(oldValue)}`); // FIXME: Remove
      const newIdentity = JSON.stringify(newValue.identity);
      const oldIdentity = oldValue === undefined ? newIdentity : JSON.stringify(oldValue.identity);
      if (newIdentity !== oldIdentity) {
        // -- Delete the attack we created --
        const attackList = charsheet.attacks.attackList;
        const index = attackList.indexOf(theAttack);
        if (index !== -1) {
          attackList.splice(index, 1); // Delete 1 item
        }
        // -- Cancel all the watches --
        for (const cancelFunc of activeWatches) {
          cancelFunc();
        }
      } else {
        // -- Update the Values --
        theAttack.name = newValue.calculations.powerName;
        theAttack.attackCheck = newValue.calculations.fighting;
        theAttack.resistanceDC = newValue.calculations.powerRanks;
      }
    }, { immediate: true }); // FIXME: Not sure if it should be immediate or not.
    return cancelFunction;
  }

  /*
   * Gets called when the updater is no longer needed. Everything it
   * created should be eliminated.
   */
  destroy() {
    // -- cancel all watches --
    for (const cancelFunction of this.activeWatches) {
      cancelFunction();
    }
    // -- remove the attack we made --
    const attackList = this.charsheet.attacks.attackList;
    const index = attackList.indexOf(this.theAttack);
    if (index !== -1) {
      attackList.splice(1, index);
    }
  }

}

const updaterClasses = {
  DamagePowerAttackUpdater
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
    recreateUnarmedAttack(charsheet);
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
    console.log(`Upgraded character from version ${oldVersion} to ${charsheet.version}.`);
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
  sortFields(charsheet);
};

export {
  currentVersion,
  newBlankCharacter,
  newBlankAdvantage,
  newBlankSkill,
  newBlankPower,
  newBlankComplication,
  findPowerByHisd,
  newHsid,
  recreateUnarmedAttack,
  upgradeVersion,
  updaterClasses
};
