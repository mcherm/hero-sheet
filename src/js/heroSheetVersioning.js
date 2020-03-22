
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 8; // Up to this version can be saved
const latestVersion = 8; // Might be an experimental version


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
        type: "UnarmedAttackUpdater",
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


/*
 * A parent class for all updaters. An Updater is a class, each instance of
 * which monitors certain fields and updates other fields in the charsheet.
 * An example would be an updater for creating an attack.
 */
class Updater {
  constructor(vm, charsheet, ...otherArgs) {
    this.activeWatches = [];
    this.charsheet = charsheet;
    this.setMoreFieldsInConstructor(vm, charsheet, ...otherArgs);
    const cancelFunction = this.createWatch(vm);
    this.activeWatches.push(cancelFunction);
  }

  /*
   * This gets run during the constructor BEFORE the watch is created. It
   * can be used to set instance fields that are needed by the watch.
   */
  setMoreFieldsInConstructor(vm, charsheet, ...otherArgs) {
  }

  /*
   * This returns an object used in the watch to determine whether the updater needs
   * to destroy itself and whether it needs to update itself. The object returned
   * should have two fields: identity is an object -- if any field has changed then
   * the updater is now invalid and should delete itself, and calculations is an
   * object -- fields from this can be used in the update the updater performs.
   */
  watchForChange() {
    throw Error("Subclasses must override this.");
  }

  /*
   * When there have been changes to the attack, this is invoked to actually apply them.
   * It is passed the new value of the calculations object from the watchForChange().
   */
  applyChanges(newCalculations) {
    throw Error("Subclasses must override this.");
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
  }

  /*
   * This is passed a newValue and oldValue each of which is an output from the watchForChange()
   * method, except that oldValue will be undefined the first time it is called. If there was
   * any change in the identity then it will delete this updater and everything it created.
   * Otherwise, it will use the values in calculations to update whatever this updater is
   * updating.
   */
  processChange(newValue, oldValue) {
    const newIdentity = JSON.stringify(newValue.identity);
    const oldIdentity = oldValue === undefined ? newIdentity : JSON.stringify(oldValue.identity);
    if (newIdentity !== oldIdentity) {
      this.destroy();
    } else {
      this.applyChanges(newValue.calculations);
    }
  }

  /*
   * Initiates the watch that drives this updater. In the future I will figure out
   * how to generalize this; right now it is all specific to DamagePowerAttackUpdater.
   * It returns the cancel function for the watch.
   */
  createWatch(vm) {
    const cancelFunction = vm.$watch(
      () => this.watchForChange.call(this),
      (newValue, oldValue) => this.processChange.call(this, newValue, oldValue)
    );
    return cancelFunction;
  }

}


class AttackUpdater extends Updater {
  constructor(vm, charsheet, ...otherArgs) {
    super(vm, charsheet, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, ...otherArgs);
    this.theAttack = this.findOrCreateTheAttack();
  }

  /*
   * Given an attack in the list of attacks, this returns true if it is
   * the one we are seeking and false if it isn't. Most subclasses will
   * override it because most attack types aren't unique.
   */
  matchAttack(attack) {
    return attack.type === this.constructor.name;
  }

  /*
   * Subclasses should override this to return a new attack JSON object.
   */
  makeNewAttack() {
    throw Error("Subclasses must override this.");
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateTheAttack() {
    const updaterName = this.constructor.name;
    const attackList = this.charsheet.attacks.attackList;
    const matchingAttacks = attackList.filter(
      x => this.matchAttack(x)
    );
    if (matchingAttacks.length > 1) {
      throw Error(`Multiple attacks of type ${updaterName} that matched.`);
    } else if (matchingAttacks.length === 1) {
      return matchingAttacks[0];
    } else {
      const newAttack = this.makeNewAttack();
      attackList.push(newAttack);
      return newAttack;
    }
  }

  /*
   * Gets called when the updater is no longer needed. Everything it
   * created should be eliminated.
   */
  destroy() {
    super.destroy();
    // -- remove the attack we made --
    const attackList = this.charsheet.attacks.attackList;
    const index = attackList.indexOf(this.theAttack);
    if (index !== -1) {
      attackList.splice(index, 1);
    }
  }

}


class UnarmedAttackUpdater extends AttackUpdater {
  constructor(vm, charsheet, ...otherArgs) {
    super(vm, charsheet, ...otherArgs);
  }

  makeNewAttack() {
    return {
      type: this.constructor.name,
      name: "Unarmed",
      attackCheck: 0,
      effectType: "damage",
      resistanceDC: 0
    };
  }

  watchForChange() {
    return {
      identity: {
      },
      calculations: {
        strength: this.charsheet.abilities.strength.ranks,
        fighting: this.charsheet.abilities.fighting.ranks
      }
    }
  }

  applyChanges(newCalculations) {
    this.theAttack.attackCheck = newCalculations.fighting;
    this.theAttack.resistanceDC = newCalculations.strength;
  }
}


class PowerAttackUpdater extends AttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  /*
   * This gets run during the constructor BEFORE the watch is created. It
   * can be used to set instance fields that are needed by the watch.
   */
  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    this.power = newUpdaterEvent.power;
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  matchAttack(attack) {
    return super.matchAttack(attack) && attack.hsid === this.power.hsid;
  }

}


class DamagePowerAttackUpdater extends PowerAttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet, newUpdaterEvent);
  }

  makeNewAttack() {
    return {
      type: this.constructor.name,
      hsid: this.power.hsid,
      name: this.power.name,
      attackCheck: this.charsheet.abilities.fighting.ranks,
      effectType: "damage",
      resistanceDC: this.power.ranks
    }
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.fighting;
    theAttack.resistanceDC = newCalculations.powerRanks;
  }

}


class AfflictionPowerAttackUpdater extends PowerAttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet, newUpdaterEvent);
  }

  makeNewAttack() {
    return {
      type: this.constructor.name,
      hsid: this.power.hsid,
      name: this.power.name,
      attackCheck: this.charsheet.abilities.fighting.ranks,
      effectType: "affliction",
      resistanceDC: this.power.ranks
    }
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.fighting;
    theAttack.resistanceDC = newCalculations.powerRanks;
  }

}


class NullifyPowerAttackUpdater extends PowerAttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet, newUpdaterEvent);
  }

  makeNewAttack() {
    return {
      type: this.constructor.name,
      hsid: this.power.hsid,
      name: this.power.name,
      attackCheck: this.charsheet.abilities.dexterity.ranks,
      effectType: "nullify",
      resistanceDC: null,
      nullifyRanks: this.power.updateRanks
    }
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        dexterity: this.charsheet.abilities.dexterity.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.dexterity;
    theAttack.nullifyRanks = newCalculations.powerRanks;
  }

}


class WeakenPowerAttackUpdater extends PowerAttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet, newUpdaterEvent);
  }

  makeNewAttack() {
    return {
      type: this.constructor.name,
      hsid: this.power.hsid,
      name: this.power.name,
      attackCheck: this.charsheet.abilities.fighting.ranks,
      effectType: "weaken",
      resistanceDC: 10 + this.power.ranks
    }
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.fighting;
    theAttack.resistanceDC = 10 + newCalculations.powerRanks;
  }

}


const updaterClasses = {
  UnarmedAttackUpdater,
  DamagePowerAttackUpdater,
  AfflictionPowerAttackUpdater,
  NullifyPowerAttackUpdater,
  WeakenPowerAttackUpdater
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
  upgradeVersion,
  updaterClasses
};
