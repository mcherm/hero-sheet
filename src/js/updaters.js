//
// Classes for performing updates.
//

/*
 * A parent class for all updaters. An Updater is a class, each instance of
 * which monitors certain fields and updates other fields in the charsheet.
 * An example would be an updater for creating an attack.
 */
import {findPowerByHsid, newHsid} from "./heroSheetVersioning";

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


const _baseStatForDefenseMap = {
  dodge: "agility",
  fortitude: "stamina",
  parry: "fighting",
  toughness: "stamina",
  will: "awareness"
};

/* Updater of rank and cost for any defense EXCEPT toughness. */
class DefenseUpdater extends Updater {
  setMoreFieldsInConstructor(vm, charsheet, defenseName, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, defenseName, ...otherArgs);
    this.defenseName = defenseName;
    if (!["dodge", "fortitude", "parry", "will"].includes(defenseName)) {
      throw new Error(`Invalid defense name "${defenseName}".`);
    }
  }

  watchForChange() {
    const purchased = this.charsheet.defenses[this.defenseName].purchased;
    const cost = purchased;
    const baseStat = _baseStatForDefenseMap[this.defenseName];
    const baseRanks = this.charsheet.abilities[baseStat].ranks + purchased;
    const activeEffectKey = `defenses.${this.defenseName}.ranks`;
    const pertinentActiveEffects = this.charsheet.activeEffects[activeEffectKey] || [];
    const ranks = pertinentActiveEffects.reduce((sum, activeEffect) => sum + activeEffect.value, baseRanks);
    return {
      identity: {}, // This updater never goes away.
      calculations: {
        cost: cost,
        ranks: ranks
      }
    };
  }

  applyChanges(newCalculations) {
    this.charsheet.defenses[this.defenseName].cost = newCalculations.cost;
    this.charsheet.defenses[this.defenseName].ranks = newCalculations.ranks;
  }
}


class ToughnessUpdater extends Updater {
  watchForChange() {
    const baseStat = _baseStatForDefenseMap["toughness"];
    const baseRanks = this.charsheet.abilities[baseStat].ranks;
    const activeEffectKey = "defenses.toughness.ranks";
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
    this.charsheet.defenses.toughness.ranks = newCalculations.ranks;
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


class ActiveEffectFromAdvantageUpdater extends Updater {
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
   * Subclasses must override this to provide the activeEffect key where their
   * effect is stored.
   */
  activeEffectKey() {
    throw new Error("Subclasses must override this.");
  }

  /*
   * Subclasses must override this to calculate the active effect value.
   */
  activeEffectValue() {
    throw new Error("Subclasses must override this.");
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateActiveEffect() {
    const updaterName = this.constructor.name;
    const activeEffectKey = this.activeEffectKey();
    if (this.charsheet.activeEffects[activeEffectKey] === undefined) {
      this.vm.$set(this.charsheet.activeEffects, activeEffectKey, []);
    }
    const possibleActiveEffects = this.charsheet.activeEffects[activeEffectKey];
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

  watchForChange() {
    return {
      identity: {
        advantageExists: this.charsheet.advantages.indexOf(this.advantage) !== -1,
        advantageName: this.advantage.name,
        advantageHsid: this.advantage.hsid
      },
      calculations: {
        activeEffectValue: this.activeEffectValue()
      }
    };
  }

  makeNewActiveEffect() {
    const result = {};
    result.hsid = newHsid();
    result.value = this.activeEffectValue();
    result.updater = this.constructor.name;
    result.advantageHsid = this.advantage.hsid;
    return result;
  }

  applyChanges(newCalculations) {
    this.activeEffect.value = newCalculations.activeEffectValue;
  }

  destroy() {
    const effectKey = this.activeEffectKey();
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


class ImprovedInitiativeUpdater extends ActiveEffectFromAdvantageUpdater {
  activeEffectKey() {
    return "initiative";
  }

  activeEffectValue() {
    return 4 * this.advantage.ranks;
  }
}


class JackOfAllTradesUpdater extends ActiveEffectFromAdvantageUpdater {
  activeEffectKey() {
    return "jackOfAllTrades";
  }

  activeEffectValue() {
    return 1;
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
    const LOOKUP_TABLE = {
      "Enhanced Strength": "abilities.strength.ranks",
      "Enhanced Stamina": "abilities.stamina.ranks",
      "Enhanced Agility": "abilities.agility.ranks",
      "Enhanced Dexterity": "abilities.dexterity.ranks",
      "Enhanced Fighting": "abilities.fighting.ranks",
      "Enhanced Intellect": "abilities.intellect.ranks",
      "Enhanced Awareness": "abilities.awareness.ranks",
      "Enhanced Presence": "abilities.presence.ranks",
      "Enhanced Dodge": "defenses.dodge.ranks",
      "Enhanced Fortitude": "defenses.fortitude.ranks",
      "Enhanced Parry": "defenses.parry.ranks",
      "Enhanced Will": "defenses.will.ranks",
      "Enhanced Acrobatics": "skills.skillList@acrobatics",
      "Enhanced Athletics": "skills.skillList@athletics",
      "Enhanced Deception": "skills.skillList@deception",
      "Enhanced Insight": "skills.skillList@insight",
      "Enhanced Intimidation": "skills.skillList@intimidation",
      "Enhanced Investigation": "skills.skillList@investigation",
      "Enhanced Perception": "skills.skillList@perception",
      "Enhanced Persuasion": "skills.skillList@persuasion",
      "Enhanced Slightofhand": "skills.skillList@slight of hand",
      "Enhanced Stealth": "skills.skillList@stealth",
      "Enhanced Technology": "skills.skillList@technology",
      "Enhanced Treatment": "skills.skillList@treatment",
      "Enhanced Vehicles": "skills.skillList@vehicles"
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
  DefenseUpdater,
  ToughnessUpdater,
  DamagePowerAttackUpdater,
  AfflictionPowerAttackUpdater,
  NullifyPowerAttackUpdater,
  WeakenPowerAttackUpdater,
  ImprovedInitiativeUpdater,
  JackOfAllTradesUpdater,
  EnhancedTraitUpdater
};


export {
  updaterClasses
};
