
const statsData = require("../data/statsData.json");
const defenseNames = require("../data/defenseNames.json");
const skillsData = require("../data/skillsData.json");

const currentVersion = 10; // Up to this version can be saved
const latestVersion = 10; // Might be an experimental version


const fieldsInOrder = ["version", "campaign", "naming", "effortPoints", "abilities", "defenses",
  "initiative", "advantages", "skills", "powers", "complications", "attacks", "activeEffects"];

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
    attacks,
    activeEffects
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
const findPowerByHsid = function(charsheet, hsid) {
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
 * Design Notes: see findPowerByHsid. We should build "findByHsid".
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
   * Initiates the watch that drives this updater. It returns the cancel function for
   * the watch.
   */
  createWatch(vm) {
    const cancelFunction = vm.$watch(
      () => this.watchForChange.call(this),
      (newValue, oldValue) => this.processChange.call(this, newValue, oldValue)
    );
    return cancelFunction;
  }

}

class StatRankUpdater extends Updater {
  setMoreFieldsInConstructor(vm, charsheet, statName, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, statName, ...otherArgs);
    this.statName = statName;
  }

  watchForChange() {
    const baseRanks = this.charsheet.abilities[this.statName].entered;
    const activeEffectKey = `abilities.${this.statName}.ranks`;
    const pertinentActiveEffects = this.charsheet.activeEffects[activeEffectKey] || [];
    const ranks = pertinentActiveEffects.reduce((sum, activeEffect) => sum + activeEffect.value, baseRanks);
    return {
      identity: {}, // This updater never goes away.
      calculations: {
        ranks: ranks
      }
    };
  }

  applyChanges(newCalculations) {
    this.charsheet.abilities[this.statName].ranks = newCalculations.ranks;
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
    return attack.updater === this.constructor.name;
  }

  /*
   * Subclasses should override this to add new fields to the object being returned.
   */
  makeNewAttack() {
    const result = {};
    result.hsid = newHsid();
    result.updater = this.constructor.name;
    return result;
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
    const result = super.makeNewAttack();
    result.name = "Unarmed";
    result.attackCheck = this.charsheet.abilities.fighting.ranks;
    result.effectType = "damage";
    result.resistanceDC = this.charsheet.abilities.strength.ranks;
    return result;
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
    return super.matchAttack(attack) && attack.powerHsid === this.power.hsid;
  }

  makeNewAttack() {
    const result = super.makeNewAttack();
    result.powerHsid = this.power.hsid;
    result.name = this.power.name;
    return result;
  }
}


class DamagePowerAttackUpdater extends PowerAttackUpdater {
  constructor(vm, charsheet, newUpdaterEvent) {
    super(vm, charsheet, newUpdaterEvent);
  }

  makeNewAttack() {
    const result = super.makeNewAttack();
    result.attackCheck = this.charsheet.abilities.fighting.ranks;
    result.effectType = "damage";
    result.resistanceDC = this.power.ranks;
    return result;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findPowerByHsid(this.charsheet, this.power.hsid) !== null,
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
    const result = super.makeNewAttack();
    result.attackCheck = this.charsheet.abilities.fighting.ranks;
    result.effectType = "affliction";
    result.resistanceDC = this.power.ranks;
    return result;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findPowerByHsid(this.charsheet, this.power.hsid) !== null,
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
    const result = super.makeNewAttack();
    result.attackCheck = this.charsheet.abilities.dexterity.ranks;
    result.effectType = "nullify";
    result.resistanceDC = null;
    result.nullifyRanks = this.power.updateRanks;
    return result;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findPowerByHsid(this.charsheet, this.power.hsid) !== null,
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
    const result = super.makeNewAttack();
    result.attackCheck = this.charsheet.abilities.fighting.ranks;
    result.effectType = "weaken";
    result.resistanceDC = 10 + this.power.ranks;
    return result;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findPowerByHsid(this.charsheet, this.power.hsid) !== null,
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


class ImprovedInitiativeUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.advantage = newUpdaterEvent.advantage;
    this.activeEffect = this.findOrCreateActiveEffect();
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateActiveEffect() {
    const updaterName = this.constructor.name;
    if (this.charsheet.activeEffects.initiative === undefined) {
      this.vm.$set(this.charsheet.activeEffects, "initiative", []);
    }
    const possibleActiveEffects = this.charsheet.activeEffects.initiative;
    const matchingActiveEffects = possibleActiveEffects.filter(
      x => x.updater === updaterName && x.advantageHsid === this.advantage.hsid
    );
    if (matchingActiveEffects.length > 1) {
      throw Error(`Multiple active effects of type ${updaterName} that matched.`);
    } else if (matchingActiveEffects.length === 1) {
      return matchingActiveEffects[0];
    } else {
      const newActiveEffect = this.makeNewActiveEffect();
      possibleActiveEffects.push(newActiveEffect);
      return newActiveEffect;
    }
  }

  /*
   * Subclasses must override this to add at least the value field to the object being returned.
   */
  makeNewActiveEffect() {
    const result = {};
    result.hsid = newHsid();
    result.value = 4 * this.advantage.ranks;
    result.updater = this.constructor.name;
    result.advantageHsid = this.advantage.hsid;
    return result;
  }

  watchForChange() {
    return {
      identity: {
        advantageExists: this.charsheet.advantages.indexOf(this.advantage) !== -1,
        advantageName: this.advantage.name,
        advantageHsid: this.advantage.hsid
      },
      calculations: {
        advantageRanks: this.advantage.ranks
      }
    }
  }

  applyChanges(newCalculations) {
    this.activeEffect.value = 4 * newCalculations.advantageRanks;
  }

  destroy() {
    const effectKey = "initiative";
    const possibleActiveEffects = this.charsheet.activeEffects[effectKey];
    if (possibleActiveEffects) {
      const currentPosition = possibleActiveEffects.indexOf(this.activeEffect);
      if (currentPosition !== -1) {
        possibleActiveEffects.splice(currentPosition, 1);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, effectKey);
      }
    }
    super.destroy();
  }
}


class EnhancedTraitUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.power = newUpdaterEvent.power;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = this.findOrCreateActiveEffect();
  }

  /*
   * Subclasses should override this to return the key their active effect is stored under.
   */
  getActiveEffectKey() {
    // FIXME: Works for abilities; but not yet for other traits
    const LOOKUP_TABLE = {
      "Enhanced Strength": "abilities.strength.ranks",
      "Enhanced Stamina": "abilities.stamina.ranks",
      "Enhanced Agility": "abilities.agility.ranks",
      "Enhanced Dexterity": "abilities.dexterity.ranks",
      "Enhanced Fighting": "abilities.fighting.ranks",
      "Enhanced Intellect": "abilities.intellect.ranks",
      "Enhanced Awareness": "abilities.awareness.ranks",
      "Enhanced Presence": "abilities.presence.ranks",
      "Enhanced Dodge": null,
      "Enhanced Fortitude": null,
      "Enhanced Parry": null,
      "Enhanced Will": null,
      "Enhanced Acrobatics": null,
      "Enhanced Athletics": null,
      "Enhanced Deception": null,
      "Enhanced Insight": null,
      "Enhanced Intimidation": null,
      "Enhanced Investigation": null,
      "Enhanced Perception": null,
      "Enhanced Persuasion": null,
      "Enhanced Slightofhand": null,
      "Enhanced Stealth": null,
      "Enhanced Technology": null,
      "Enhanced Treatment": null,
      "Enhanced Vehicles": null
    };
    const result = LOOKUP_TABLE[this.power.option];
    if (result) {
      return result;
    } else {
      throw new Error(`The option ${this.power.option} is not yet supported by EnhancedTraitUpdater.`)
    }
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   *
   * FIXME: Some duplicated code here. Figure out how to share it.
   */
  findOrCreateActiveEffect() {
    const updaterName = this.constructor.name;
    if (this.charsheet.activeEffects[(this.activeEffectKey)] === undefined) {
      this.vm.$set(this.charsheet.activeEffects, this.activeEffectKey, []);
    }
    const possibleActiveEffects = this.charsheet.activeEffects[(this.activeEffectKey)];
    const matchingActiveEffects = possibleActiveEffects.filter(
      x => x.updater === updaterName && x.powerHsid === this.power.hsid
    );
    if (matchingActiveEffects.length > 1) {
      throw Error(`Multiple active effects of type ${updaterName} and power ${this.power.hsid} that matched.`);
    } else if (matchingActiveEffects.length === 1) {
      return matchingActiveEffects[0];
    } else {
      const newActiveEffect = this.makeNewActiveEffect();
      possibleActiveEffects.push(newActiveEffect);
      return newActiveEffect;
    }
  }

  makeNewActiveEffect() {
    const result = {};
    result.hsid = newHsid();
    result.value = this.power.ranks;
    result.updater = this.constructor.name;
    result.powerHsid = this.power.hsid;
    return result;
  }

  watchForChange() {
    return {
      identity: {
        powerExists: findPowerByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect,
        powerOption: this.power.option
      },
      calculations: {
        powerRanks: this.power.ranks
      }
    };
  }

  applyChanges(newCalculations) {
    this.activeEffect.value = newCalculations.powerRanks;
  }

  destroy() {
    const possibleActiveEffects = this.charsheet.activeEffects[this.activeEffectKey];
    if (possibleActiveEffects) {
      const currentPosition = possibleActiveEffects.indexOf(this.activeEffect);
      if (currentPosition !== -1) {
        possibleActiveEffects.splice(currentPosition, 1);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, this.activeEffectKey);
      }
    }
    super.destroy();
  }
}


const updaterClasses = {
  UnarmedAttackUpdater,
  StatRankUpdater,
  DamagePowerAttackUpdater,
  AfflictionPowerAttackUpdater,
  NullifyPowerAttackUpdater,
  WeakenPowerAttackUpdater,
  ImprovedInitiativeUpdater,
  EnhancedTraitUpdater
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
  while (charsheet.version < latestVersion) {
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
  findPowerByHsid,
  findAdvantageByHsid,
  newHsid,
  upgradeVersion,
  updaterClasses
};
