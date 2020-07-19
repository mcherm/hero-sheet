//
// Classes for performing updates.
//

import {findFeatureByHsid, findAdvantageByHsid, findSkillByHsid, findAllyByHsid, newHsid, newAdjustment} from "./heroSheetVersioning.js";
import {activeEffectModifier, findOrCreateActiveEffect, totalCost} from "./heroSheetUtil.js"


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
   * Returns the name of the updater. Once upon a time I used to use this.constructor.name
   * but it turns out the vue.js compiling process makes that different on the server
   * than in the development environment, so I'm inverting the updaterClasses dictionary
   * instead.
   */
  className() {
    return Object.keys(updaterClasses).find(name => this instanceof updaterClasses[name]);
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
   *
   * NOTE: Right now I have 2 versions of this: the short version and the version
   *  that helps me to do debugging. There's probably a better way.
   */
  createWatch(vm) {
    const DEBUGGING_ON = false;
    if (!DEBUGGING_ON) {
      const cancelFunction = vm.$watch(
        () => this.watchForChange.call(this),
        (newValue, oldValue) => this.processChange.call(this, newValue, oldValue)
      );
      return cancelFunction;
    } else {
      const myThis = this;
      const cancelFunction = vm.$watch(
        () => {
          console.log(`Will perform the test of this watch in a ${myThis.className()}.`);
          return myThis.watchForChange.call(myThis);
        },
        (newValue, oldValue) => {
          console.log(`in the watch, got ${JSON.stringify(newValue)} from ${JSON.stringify(oldValue)}`);
          return myThis.processChange.call(myThis, newValue, oldValue)
        }
      );
      return cancelFunction;
    }
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
    const ranks = baseRanks + activeEffectModifier(this.charsheet, activeEffectKey);
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
    const ranks = baseRanks + activeEffectModifier(this.charsheet, activeEffectKey);
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
    const ranks = baseRanks + activeEffectModifier(this.charsheet, "defenses.toughness.ranks");
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
    return attack.updater === this.className();
  }

  /*
   * Subclasses should override this to add new fields to the object being returned.
   */
  makeNewAttack() {
    const result = {};
    result.hsid = newHsid();
    result.updater = this.className();
    return result;
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateTheAttack() {
    const updaterName = this.className();
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
   * Returns the total adjustment due to activeEffects on the check for
   * this attack.
   */
  attackCheckAdjustment() {
    return activeEffectModifier(this.charsheet, `attacks.${this.theAttack.hsid}.check`);
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
        fighting: this.charsheet.abilities.fighting.ranks,
        attackCheckAdjustment: this.attackCheckAdjustment()
      }
    }
  }

  applyChanges(newCalculations) {
    this.theAttack.attackCheck = newCalculations.fighting + newCalculations.attackCheckAdjustment;
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
    result.attackCheck = this._attackCheckFormula({
      fighting: this.charsheet.abilities.fighting.ranks,
      attackCheckAdjustment: 0
    });
    result.effectType = "damage";
    result.resistanceDC = this._resistanceDCFormula({
      powerRanks: this.power.ranks,
      isStrengthBased: this._isStrengthBased(this.power),
      strength: this.charsheet.abilities.strength.ranks
    });
    return result;
  }

  _isStrengthBased(power) {
    return power.extras.filter(
      x => x.modifierSource === "special" && x.modifierName === "Strength Based"
    ).length > 0;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        strength: this.charsheet.abilities.strength.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name,
        attackCheckAdjustment: this.attackCheckAdjustment(),
        isStrengthBased: this._isStrengthBased(this.power)
      }
    }
  }

  /* Calculate the attack check based on given inputs. Used for update and create. */
  _attackCheckFormula(inputs) {
    const {fighting, attackCheckAdjustment} = inputs;
    return fighting + attackCheckAdjustment;
  }

  /* Calculate the resistanceDC based on given inputs. Used for update and create. */
  _resistanceDCFormula(inputs) {
    const {powerRanks, isStrengthBased, strength} = inputs;
    return powerRanks + (isStrengthBased ? strength : 0);
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = this._attackCheckFormula(newCalculations);
    theAttack.resistanceDC = this._resistanceDCFormula(newCalculations);
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
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name,
        attackCheckAdjustment: this.attackCheckAdjustment()
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.fighting + newCalculations.attackCheckAdjustment;
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
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        dexterity: this.charsheet.abilities.dexterity.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name,
        attackCheckAdjustment: this.attackCheckAdjustment()
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.dexterity + newCalculations.attackCheckAdjustment;
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
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: {
        fighting: this.charsheet.abilities.fighting.ranks,
        powerRanks: this.power.ranks,
        powerName: this.power.name,
        attackCheckAdjustment: this.attackCheckAdjustment()
      }
    }
  }

  applyChanges(newCalculations) {
    // -- Update the Values --
    const theAttack = this.theAttack;
    theAttack.name = newCalculations.powerName;
    theAttack.attackCheck = newCalculations.fighting + newCalculations.attackCheckAdjustment;
    theAttack.resistanceDC = 10 + newCalculations.powerRanks;
  }

}


/*
 * For Updaters that create an ActiveEffect, this is designed to run once during
 * the constructor to create (if an edit has been performed, creating the Updater)
 * or find (if the charsheet was just loaded) the specific active effect within
 * the charsheet.
 *
 * It expects the updater to support the following
 *  * this.className (all Updaters support this)
 *  * this.vm (all Updater support this)
 *  * this.charsheet (all Updaters support this)
 *  * this.activeEffectKey
 *  * this.isMyActiveEffect()
 *  * this.makeNewActiveEffect()
 */
function findOrCreateUpdaterActiveEffect(updater) {
  const updaterName = updater.className();
  return findOrCreateActiveEffect(
    updater.charsheet,
    updater.activeEffectKey,
    x => x.updater === updaterName && updater.isMyActiveEffect(x),
    x => updater.makeNewActiveEffect(x)
  );
}



class ActiveEffectFromAdvantageUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.advantage = newUpdaterEvent.advantage;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const advantage = findAdvantageByHsid(charsheet, activeEffect.advantageHsid);
    if (advantage === null) {
      throw new Error("Updater references hsid that isn't found.");
    }
    return {updater: activeEffect.updater, advantage: advantage};
  }

  /*
   * Subclasses must override this to provide the activeEffect key where their
   * effect is stored.
   */
  getActiveEffectKey() {
    throw new Error("Subclasses must override this.");
  }

  /*
   * Given an ActiveEffect entry for an updater of this class, this returns
   * a boolean indicating whether it is the one belonging to this updater.
   */
  isMyActiveEffect(activeEffect) {
    return activeEffect.advantageHsid === this.advantage.hsid
  }

  /*
   * Subclasses must override this to calculate the active effect value.
   */
  activeEffectValue() {
    throw new Error("Subclasses must override this.");
  }

  /*
   * Subclasses must override this to provide a description to be displayed
   * (or null for "don't show this one").
   */
  getDescription() {
    throw new Error("Subclasses must override this.");
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
    return newAdjustment(
      this.getDescription(),
      this.activeEffectValue(),
      {
        updater: this.className(),
        advantageHsid: this.advantage.hsid
      }
    );
  }

  applyChanges(newCalculations) {
    this.activeEffect.value = newCalculations.activeEffectValue;
  }

  destroy() {
    const effectKey = this.activeEffectKey;
    const possibleActiveEffects = this.charsheet.activeEffects[effectKey];
    if (possibleActiveEffects) {
      const currentPosition = possibleActiveEffects.indexOf(this.activeEffect);
      if (currentPosition !== -1) {
        possibleActiveEffects.splice(currentPosition, 1);
      } else {
        console.log(`Attempted to delete a ${this.className()} but it wasn't there.`);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, effectKey);
      }
    }
    super.destroy();
  }
}


class ImprovedInitiativeUpdater extends ActiveEffectFromAdvantageUpdater {
  getActiveEffectKey() {
    return "initiative";
  }

  activeEffectValue() {
    return 4 * this.advantage.ranks;
  }

  getDescription() {
    return "Improved Initiative Advantage";
  }
}


class JackOfAllTradesUpdater extends ActiveEffectFromAdvantageUpdater {
  getActiveEffectKey() {
    return "jackOfAllTrades";
  }

  activeEffectValue() {
    return 1;
  }

  getDescription() {
    return "Jack of All Trades Advantage";
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
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const feature = findFeatureByHsid(charsheet, activeEffect.powerHsid);
    if (feature === null) {
      throw new Error("Updater references hsid that isn't found.");
    }
    return {updater: activeEffect.updater, power: feature};
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
      "Enhanced Initiative": "initiative",
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
   * Given an ActiveEffect entry for an updater of this class, this returns
   * a boolean indicating whether it is the one belonging to this updater.
   */
  isMyActiveEffect(activeEffect) {
    return activeEffect.powerHsid === this.power.hsid
  }

  makeNewActiveEffect() {
    return newAdjustment(
        `${this.power.option} from Power`,
        this.power.ranks,
        {
          updater: this.className(),
          powerHsid: this.power.hsid
        }
    );
  }

  watchForChange() {
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
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
      } else {
        console.log(`Attempted to delete a ${this.className()} but it wasn't there.`);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, this.activeEffectKey);
      }
    }
    super.destroy();
  }
}


class ProtectionUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.power = newUpdaterEvent.power;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const feature = findFeatureByHsid(charsheet, activeEffect.powerHsid);
    if (feature === null) {
      throw new Error("Updater references hsid that isn't found.");
    }
    return {updater: activeEffect.updater, power: feature};
  }

  /*
   * Subclasses should override this to return the key their active effect is stored under.
   */
  getActiveEffectKey() {
    return "defenses.toughness.ranks";
  }

  /*
   * Given an ActiveEffect entry for an updater of this class, this returns
   * a boolean indicating whether it is the one belonging to this updater.
   */
  isMyActiveEffect(activeEffect) {
    return activeEffect.powerHsid === this.power.hsid
  }

  makeNewActiveEffect() {
    return newAdjustment(
        "Protection",
        this.power.ranks,
        {
          updater: this.className(),
          powerHsid: this.power.hsid,
        }
    );
  }

  watchForChange() {
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
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
      } else {
        console.log(`Attempted to delete a ${this.className()} but it wasn't there.`);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, this.activeEffectKey);
      }
    }
    super.destroy();
  }
}


class CombatSkillUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.skill = newUpdaterEvent.skill;
    this.activeEffectKey = `attacks.${this.skill.attackHsid}.check`;
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const skill = findSkillByHsid(charsheet, activeEffect.skillHsid);
    if (skill === null) {
      throw new Error("Updater references hsid that isn't found.");
    }
    return {updater: activeEffect.updater, skill: skill};
  }

  /*
   * Given an ActiveEffect entry for an updater of this class, this returns
   * a boolean indicating whether it is the one belonging to this updater.
   */
  isMyActiveEffect(activeEffect) {
    return activeEffect.skillHsid === this.skill.hsid
  }

  makeNewActiveEffect() {
    const capitalizedName = {
      "close combat": "Close Combat",
      "ranged combat": "Ranged Combat"
    }[this.skill.name];

    return newAdjustment(
        `${capitalizedName} Skill`,
        this.skill.ranks,
        {
          updater: this.className(),
          skillHsid: this.skill.hsid,
        }
    );
  }

  watchForChange() {
    const result = {
      identity: {
        skillExists: this.charsheet.skills.skillList.indexOf(this.skill) !== -1,
        attackHsid: this.skill.attackHsid
      },
      calculations: {
        activeEffectValue: this.skill.ranks
      }
    };
    return result;
  }

  applyChanges(newCalculations) {
    this.activeEffect.value = newCalculations.activeEffectValue;
  }

  // FIXME: Some duplicated code here - see ActiveEffectFromAdvantageUpdater
  destroy() {
    const possibleActiveEffects = this.charsheet.activeEffects[(this.activeEffectKey)];
    if (possibleActiveEffects) {
      const currentPosition = possibleActiveEffects.indexOf(this.activeEffect);
      if (currentPosition !== -1) {
        possibleActiveEffects.splice(currentPosition, 1);
      } else {
        console.log(`Attempted to delete a ${this.className()} but it wasn't there.`);
      }
      if (possibleActiveEffects.length === 0) {
        this.vm.$delete(this.charsheet.activeEffects, this.activeEffectKey);
      }
    }
    super.destroy();
  }
}


class EquipmentFeatureUpdater extends Updater {
  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, ...otherArgs);
    this.item = newUpdaterEvent.item;
  }

  watchForChange() {
    return {
      identity: {
        equipmentExists: this.charsheet.equipment.includes(this.item)
      },
      calculations: {
        featureCost: Math.round(this.item.feature.cost / 5)
      }
    }
  }

  applyChanges(newCalculations) {
    this.item.cost = newCalculations.featureCost;
  }
}


/*
 * Updates allies in two directions: pushing the cost upward to the parent
 * and pushing things like the setting and player downward.
 */
class AllyUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.vm = vm; // Consider: is this a good idea? Should it be in all updaters?
    this.allyHsid = newUpdaterEvent.allyHsid;
    this.advantageHsid = newUpdaterEvent.advantageHsid;
  }

  watchForChange() {
    const campaignPowerLevel = this.charsheet.campaign.powerLevel;
    const campaignSetting = this.charsheet.campaign.setting;
    const playerName = this.charsheet.naming.player;
    const ally = findAllyByHsid(this.charsheet, this.allyHsid);
    const allyExists = ally !== undefined;
    const allyType = allyExists ? ally.type : null;
    const allyCost = allyExists ? totalCost(ally.charsheet) : 0;
    const advantage = findAdvantageByHsid(this.charsheet, this.advantageHsid);
    const advantageExists = advantage !== null;
    const advantageName = advantageExists ? advantage.name : null;
    return {
      identity: {
        allyExists,
        allyType,
        advantageExists,
        advantageName,
      }, // This updater never goes away.
      calculations: {
        allyType,
        allyCost,
        campaignPowerLevel,
        campaignSetting,
        playerName,
      }
    };
  }

  applyChanges(newCalculations) {
    const allyCharsheet = findAllyByHsid(this.charsheet, this.allyHsid).charsheet;
    allyCharsheet.campaign.powerLevel = newCalculations.campaignPowerLevel;
    allyCharsheet.campaign.setting = newCalculations.campaignSetting;
    allyCharsheet.naming.player = newCalculations.playerName;
    const advantage = findAdvantageByHsid(this.charsheet, this.advantageHsid);
    if (newCalculations.allyType === "sidekick") {
      advantage.ranks = Math.ceil(newCalculations.allyCost / 5);
    } else if (newCalculations.allyType === "minion") {
      advantage.ranks = Math.ceil(newCalculations.allyCost / 15);
    } else {
      throw Error(`Ally type ${newCalculations.allyType} not supported.`);
    }
  }
}


class ConstraintUpdater extends Updater {
  constructor(vm, charsheet, ...otherArgs) {
    super(vm, charsheet, ...otherArgs);
  }

  watchForChange() {
    const attacks = {};
    this.charsheet.attacks.attackList.forEach(attack => {
      attacks[attack.hsid] = {
        "attackCheck": attack.attackCheck,
        "resistanceDC": attack.resistanceDC
      };
    });
    const normalSkills = {};
    const templateSkills = {};
    this.charsheet.skills.skillList.forEach(skill => {
      if (skill.isTemplate) {
        templateSkills[skill.hsid] = skill.ranks; // FIXME: Needs to be based on skill ROLL, not skill ranks.
      } else {
        normalSkills[skill.name] = skill.ranks; // FIXME: Needs to be based on skill ROLL, not skill ranks.
      }
    });
    return {
      "identity": {}, // This updater never goes away.
      "calculations": {
        "powerLevel": this.charsheet.campaign.powerLevel,
        "dodge": this.charsheet.defenses.dodge.ranks,
        "fortitude": this.charsheet.defenses.fortitude.ranks,
        "parry": this.charsheet.defenses.parry.ranks,
        "toughness": this.charsheet.defenses.toughness.ranks,
        "will": this.charsheet.defenses.will.ranks,
        attacks,
        normalSkills,
        templateSkills
      }
    };
  }

  applyChanges(newCalculations) {
    const calcs = newCalculations; // shorter name
    const hasGmApproval = key => {
      const existingViolation = this.charsheet.constraintViolations[key];
      return existingViolation ? existingViolation.gmApproval : false;
    };
    const constraintValue = key => { return { "gmApproval": hasGmApproval(key) }; };
    const oldV = this.charsheet.constraintViolations;
    const newV = {};
    if (calcs.dodge + calcs.toughness > 2 * calcs.powerLevel) {
      newV.DodgeAndToughness = constraintValue("DodgeAndToughness");
    }
    if (calcs.parry + calcs.toughness > 2 * calcs.powerLevel) {
      newV.ParryAndToughness = constraintValue("ParryAndToughness");
    }
    if (calcs.fortitude + calcs.will > 2 * calcs.powerLevel) {
      newV.FortitudeAndWill = constraintValue("FortitudeAndWill");
    }
    for (const hsid in calcs.attacks)  {
      const attackCheck = calcs.attacks[hsid].attackCheck;
      const resistanceDC = calcs.attacks[hsid].resistanceDC;
      if (attackCheck + resistanceDC > 2 * calcs.powerLevel) {
        const key = `AttackRoll@${hsid}`;
        newV[key] = constraintValue(key);
      }
    }
    for (const skillName in calcs.normalSkills) {
      if (calcs.normalSkills[skillName] > 10 + calcs.powerLevel) {
        const key = `NormalSkillLimit@${skillName}`;
        newV[key] = constraintValue(key);
      }
    }
    for (const skillHsid in calcs.templateSkills) {
      if (calcs.templateSkills[skillHsid] > 10 + calcs.powerLevel) {
        const key = `TemplateSkillLimit@${skillHsid}`;
        newV[key] = constraintValue(key);
      }
    }
    this.charsheet.constraintViolations = newV;
  }
}

const updaterClasses = {
  StatRankUpdater,
  DefenseUpdater,
  ToughnessUpdater,
  UnarmedAttackUpdater,
  DamagePowerAttackUpdater,
  AfflictionPowerAttackUpdater,
  NullifyPowerAttackUpdater,
  WeakenPowerAttackUpdater,
  ImprovedInitiativeUpdater,
  JackOfAllTradesUpdater,
  EnhancedTraitUpdater,
  ProtectionUpdater,
  CombatSkillUpdater,
  EquipmentFeatureUpdater,
  AllyUpdater,
  ConstraintUpdater,
};


/*
 * An exception type.
 */
class UnsupportedUpdaterInActiveEffectError extends Error {
}


/*
 * This gets called when a character sheet is loaded and the updaters need
 * to be re-created. It creates and installs a new updater (and returns
 * nothing, since it gets installed in the vm).
 *
 * Inputs are a vm to bind to, the charsheet, and the particular activeEffect
 * for which an updater should be created. The activeEffect passed should
 * one that has an "updater" property.
 *
 * If the call fails because the updater type is not known or does not
 * support being created from an active effect, then this will throw an
 * UnsupportedUpdaterInActiveEffectError.
 */
const newUpdaterFromActiveEffect = function(vm, charsheet, activeEffect) {
  const updaterType = activeEffect.updater;
  const updaterClass = updaterClasses[updaterType];
  if (updaterClass === undefined || !("updateEventFromActiveEffect" in updaterClass)) {
    throw new UnsupportedUpdaterInActiveEffectError(`Unsupported updater type '${updaterType}' in activeEffect.`);
  }
  const updateEvent = updaterClass.updateEventFromActiveEffect(vm, charsheet, activeEffect);
  return new updaterClasses[updaterType](vm, charsheet, updateEvent);
};


export {
  updaterClasses,
  newUpdaterFromActiveEffect,
  UnsupportedUpdaterInActiveEffectError,
};
