//
// Classes for performing updates.
//

import {
  findFeatureByHsid, findAdvantageByHsid, findSkillByHsid, findAllyByHsid,
  newHsid, newAdjustment
} from "@/js/heroSheetVersioning.js";
import {
  activeEffectModifier, findOrCreateActiveEffect, totalCost, skillRoll, lacksStat, rangeToInt,
  intToRange, attackRollInfo, powerCostCalculate, activationState, showAlert, getInheritedModifierLists,
} from "@/js/heroSheetUtil.js"
const standardPowers = require("@/data/standardPowers.json");
const sensesData = require("@/data/sensesData.json");
const selectionLayouts = require("@/data/selectionLayouts.json");


/*
 * A parent class for all updaters. An Updater is a class, each instance of
 * which monitors certain fields and updates other fields in the charsheet.
 * An example would be an updater for creating an attack.
 */
class Updater {
  constructor(vm, charsheet, ...otherArgs) {
    this.activeWatches = [];
    this.vm = vm;
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
    const entered = this.charsheet.abilities[this.statName].entered;
    const characterLacksStat = lacksStat(this.charsheet, this.statName);
    let calculatedRanks;
    if (!characterLacksStat) {
      const activeEffectKey = `abilities.${this.statName}.ranks`;
      calculatedRanks = entered + activeEffectModifier(this.charsheet, activeEffectKey);
    }
    const ranks = characterLacksStat ? entered : calculatedRanks;
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
    const baseStat = _baseStatForDefenseMap[this.defenseName];
    const statLacking = lacksStat(this.charsheet, baseStat);
    const cost = statLacking ? 0 : purchased;
    const baseRanks = this.charsheet.abilities[baseStat].ranks;
    let ranks;
    if (statLacking) {
      ranks = baseRanks;
    } else {
      const activeEffectKey = `defenses.${this.defenseName}.ranks`;
      ranks = baseRanks + purchased + activeEffectModifier(this.charsheet, activeEffectKey);
    }
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
    const statLacking = lacksStat(this.charsheet, baseStat);
    let ranks;
    if (statLacking) {
      ranks = baseRanks;
    } else {
      ranks = baseRanks + activeEffectModifier(this.charsheet, "defenses.toughness.ranks");
    }
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
    this.initializeAttackFields(result);
    return result;
  }

  initializeAttackFields(attack) {
    attack.effectType = this.getEffectType();
    this.applyChangesToAttack(attack, this.getCalculations(attack.hsid));
  }

  /*
   * These fields are common to all Attack updaters.
   *
   * If it is called before this.theAttack is set, then callers must provide
   * the value of the hsid.
   */
  getCalculations(hsid) {
    const range = this.findRange();
    const adjustmentForDistance = activeEffectModifier(this.charsheet, `attacks@${range}.check`);
    const adjustmentForSpecificAttack = activeEffectModifier(this.charsheet, `attacks.${hsid}.check`);
    const attackCheckAdjustment = adjustmentForDistance + adjustmentForSpecificAttack;
    return {
      name: this.getName(),
      range: range,
      scope: this.findScope(),
      ranks: this.getRanks(),
      isStrengthBased: this.isStrengthBased(),
      attackCheckAdjustment: attackCheckAdjustment,
      isActive: this.isActive(),
    };
  }

  applyChanges(calc) {
    this.applyChangesToAttack(this.theAttack, calc);
  }

  applyChangesToAttack(attack, calc) {
    attack.name = calc.name;
    attack.range = calc.range;
    attack.scope = calc.scope;
    attack.ranks = calc.ranks;
    attack.isStrengthBased = calc.isStrengthBased;
    attack.attackCheckAdjustment = calc.attackCheckAdjustment;
    attack.isActive = calc.isActive;
  }

  getName() {
    throw new Error("Subclasses must override this.");
  }

  getEffectType() {
    throw new Error("Subclasses must override this.");
  }

  findRange() {
    throw new Error("Subclasses must override this.");
  }

  findScope() {
    throw new Error("Subclasses must override this.");
  }

  isStrengthBased() {
    throw new Error("Subclasses must override this.");
  }

  isActive() {
    throw new Error("Subclasses must override this.");
  }

  getRanks() {
    throw new Error("Subclasses must override this.");
  }

  /*
   * Finds the existing attack and returns it, or returns null if the attack can't
   * be found.
   */
  findTheAttack() {
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
      return null;
    }
  }

  /*
   * This is run once during the constructor to obtain or create the specific
   * attack.
   */
  findOrCreateTheAttack() {
    const foundAttack = this.findTheAttack();
    if (foundAttack === null) {
      const newAttack = this.makeNewAttack();
      this.charsheet.attacks.attackList.push(newAttack);
      return newAttack;
    } else {
      return foundAttack;
    }
  }

  /*
   * This is called to re-write all the attack fields other than HSID; it will be used when loading
   * to ensure that the data is accurate.
   */
  reinitializeTheAttack() {
    this.theAttack.updater = this.className();
    this.initializeAttackFields(this.theAttack);
  }

  /*
   * For cases where an attack needs to be removed from the list, this method
   * can be used.
   */
  removeTheAttack() {
    const foundAttack = this.findTheAttack();
    if (foundAttack !== null) {
      const attackList = this.charsheet.attacks.attackList;
      const index = attackList.indexOf(foundAttack);
      if (index !== -1) {
        attackList.splice(index, 1);
      }
    }
    this.theAttack = null;
  }

  /*
   * Gets called when the updater is no longer needed. Everything it
   * created should be eliminated.
   */
  destroy() {
    super.destroy();
    this.removeTheAttack();
  }

}


class BuiltInAttackUpdater extends AttackUpdater {

  getEffectType() {
    return "damage";
  }

  findScope() {
    return "singleTarget";
  }

  isStrengthBased() {
    return true;
  }

  isActive() {
    return true;
  }

  getRanks() {
    return 0;
  }

  watchForChange() {
    return {
      identity: {
      },
      calculations: this.getCalculations(this.theAttack.hsid)
    }
  }

}

class UnarmedAttackUpdater extends BuiltInAttackUpdater {
  getName() {
    return "Unarmed";
  }

  findRange() {
    return "close";
  }
}


class ThrownAttackUpdater extends BuiltInAttackUpdater {
  getName() {
    return "Thrown Object";
  }

  findRange() {
    return "ranged";
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

  initializeAttackFields(attack) {
    super.initializeAttackFields(attack);
    attack.powerHsid = this.power.hsid;
  }

  getName() {
    return this.power.name;
  }

  getEffectType() {
    const POWER_TO_ATTACK_MAP = {
      "Damage": "damage",
      "Affliction": "affliction",
      "Nullify": "nullify",
      "Weaken": "weaken",
    };
    return POWER_TO_ATTACK_MAP[this.power.effect];
  }

  findRange() {
    const baseRange = rangeToInt(standardPowers[this.power.effect].range);
    const supportObsoleteRange = true;
    const rangeEffect = function(mod) {
      if (supportObsoleteRange && mod.modifierName === "Increased Range") {
        return mod.ranks;
      } else if (supportObsoleteRange && mod.modifierName === "Reduced Range") {
        return -mod.ranks;
      } else if (["Increase to Ranged", "Increase to Perception"].includes(mod.modifierName)) {
        return 1;
      } else if (["Decrease to Ranged", "Decrease to Close"].includes(mod.modifierName)) {
        return -1;
      } else {
        return 0;
      }
    }
    const increasedRange = this.power.extras.reduce((sum, mod) => sum + rangeEffect(mod), 0);
    const diminishedRange = this.power.flaws.reduce((sum, mod) => sum + rangeEffect(mod), 0);
    return intToRange(baseRange + increasedRange + diminishedRange);
  }

  findScope() {
    const hasAreaMod = this.power.extras.some(mod => mod.modifierName === "Area");
    return hasAreaMod ? "area" : "singleTarget";
  }

  isStrengthBased() {
    return this.power.extras.filter(
      x => x.modifierSource === "special" && x.modifierName === "Strength Based"
    ).length > 0;
  }

  isActive() {
    return activationState(this.power).isActive;
  }

  getRanks() {
    return activationState(this.power).ranks;
  }

  watchForChange() {
    // -- Test Function for Watch --
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerHsid: this.power.hsid,
        powerEffect: this.power.effect
      },
      calculations: this.getCalculations(this.theAttack.hsid)
    };
  }

}


/*
 * Move Object has a few quirks so it overrides the base PowerAttackUpdater.
 */
class MoveObjectThrownAttackUpdater extends PowerAttackUpdater {
  getEffectType() {
    return "damage";
  }

  getName() {
    return `Thrown using ${this.power.name}`;
  }

  getCalculations(hsid) {
    const result = super.getCalculations(hsid);
    const throwingMastery = this.power.extras.reduce(
      (sum, mod) => sum + (mod.modifierSource==="special" && mod.modifierName==="Throwing Mastery" ? mod.ranks : 0),
      0
    );
    const improvisedWeaponMastery = this.power.extras.reduce(
      (sum, mod) => sum + (mod.modifierSource==="special" && mod.modifierName==="Improvised Weapon Mastery" ? mod.ranks : 0),
      0
    );
    result.damageAdjustment = throwingMastery + improvisedWeaponMastery;
    return result;
  }

  applyChangesToAttack(attack, calc) {
    super.applyChangesToAttack(attack, calc);
    attack.ranks = attack.ranks + calc.damageAdjustment;
  }
}


/*
 * The Senses power should grant you some senses and should auto-calculate its ranks and cost.
 */
class SensesPowerUpdater extends Updater {
  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.power = newUpdaterEvent.power;
  }

  watchForChange() {
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerEffect: this.power.effect,
      },
      calculations: {
        addedSenses: this.power.extended.addedSenses,
        addedSenseTypeQualities: this.power.extended.addedSenseTypeQualities,
        addedSenseQualities: this.power.extended.addedSenseQualities,
        isActive: activationState(this.power).isActive,
      }
    };
  }


  applyChanges(newCalculations) {
    const vm = this.vm;
    const powerHsid = this.power.hsid;
    const charsheetSenses = this.charsheet.senses;
    const isActive = newCalculations.isActive;

    const addNewSenseIfMissing = function({sense, senseType, hsid}) {
      // -- Create Sense Type if it doesn't exist --
      let senseTypeEntry = charsheetSenses[senseType];
      if (senseTypeEntry === undefined) {
        senseTypeEntry = {
          name: senseType,
          senses: [],
          qualities: [],
        };
        vm.$set(charsheetSenses, senseType, senseTypeEntry);
      }
      // -- Check if we need to create the sense --
      const senseList = senseTypeEntry.senses;
      if (!senseList.some(x => x.sourceHsid === hsid)) {
        // -- Yes, we do. Create the new sense ---
        const newSenseData = sensesData.senses[sense];
        const newSense = {
          name: sense,
          hsid: newHsid(),
          sourceFeatureHsid: powerHsid,
          sourceHsid: hsid,
          qualities: newSenseData.defaultQualities.map(x => {
            return {name: x}
          }),
        };
        senseList.push(newSense);
      }
    };

    const addNewQualityIfMissing = function({senseType, quality, hsid, ranks, senseHsid}) {
      // --- If this quality isn't already in the sense or sense type, add it ---
      // -- find the list of charsheet qualities it belongs in --
      let qualities = null;
      if (senseHsid === undefined) { // it's a sense type
        qualities = charsheetSenses[senseType].qualities
      } else { // it's a sense
        const charsheetSenseType = charsheetSenses[senseType];
        if (charsheetSenseType === undefined) {
          // That sense type doesn't exist so the sense doesn't
          // NOTE: This happens when a sense type like radio has been created and then the sense
          //   is deleted. I can't prevent that because it could be deleted in a different power.
          //   So what will I do about it? For now I'll let the user know; the user will need to
          //   delete the power to fix the problem.
          showAlert({
            message: "If you delete a sense which had qualities you may have to remove the power to reset the cost.",
            lifetime: "long",
            format: "info",
          });
          return;
        } else {
          const possibleSenses = charsheetSenseType.senses.filter(x => x.hsid === senseHsid);
          if (possibleSenses.length === 0) {
            // NOTE: This happens when a sense has been created and then the sense
            //   is deleted. I can't prevent that because it could be deleted in a different power.
            //   So what will I do about it? For now I'll let the user know; the user will need to
            //   delete the power to fix the problem.
            showAlert({
              message: "If you delete a sense which had qualities you may have to remove the power to reset the cost.",
              lifetime: "long",
              format: "info",
            });
            return;
          } else {
            qualities = possibleSenses[0].qualities;
          }
        }
      }
      // -- Check if we need to create the quality --
      if (!qualities.some(x => x.sourceHsid === hsid)) {
        // -- Yes, we DO need to create it --
        const newQuality = {
          name: quality,
          sourceFeatureHsid: powerHsid,
          sourceHsid: hsid,
        };
        if (ranks !== undefined) {
          newQuality.ranks = ranks;
        }
        qualities.push(newQuality);
      }
    };

    // -- Set the ranks of the power correctly --
    let ranks = 0;
    newCalculations.addedSenses.forEach(addedSense => {
      const senseCost = sensesData.senses[addedSense.sense].cost;
      ranks += senseCost;
    });
    newCalculations.addedSenseTypeQualities.forEach(addedQuality => {
      const qualityCostPerRank = sensesData.senseQualities[addedQuality.quality].costForSenseType;
      const qualityCost = qualityCostPerRank * (addedQuality.ranks === undefined ? 1 : addedQuality.ranks);
      ranks += qualityCost;
    });
    newCalculations.addedSenseQualities.forEach(addedQuality => {
      const qualityCostPerRank = sensesData.senseQualities[addedQuality.quality].costForSense;
      const qualityCost = qualityCostPerRank * (addedQuality.ranks === undefined ? 1 : addedQuality.ranks);
      ranks += qualityCost;
    });
    // -- IF it changed, set the ranks and the costs for the power --
    if (ranks !== this.power.ranks) {
      this.vm.$set(this.power, "ranks", ranks);
      // NOTE: I'm not sure passing [] to powerCostCalculate for extraModifierLists is accurate - that may be a bug
      // (if so, the bug exists for all of the other powers also).
      const calculatedFields = powerCostCalculate(this.power, getInheritedModifierLists(this.charsheet, this.power));
      this.vm.$set(this.power, "cost", calculatedFields.cost);
    }

    // -- For every sense or quality we have, add it to the charsheet senses it it's active and it isn't already there
    if (isActive) {
      newCalculations.addedSenses.forEach(addNewSenseIfMissing);
      newCalculations.addedSenseTypeQualities.forEach(addNewQualityIfMissing);
      newCalculations.addedSenseQualities.forEach(addNewQualityIfMissing);
    }
    // -- Also check for anything that needs to be deleted
    this.removeDeletedSenseStuff(newCalculations);
  }

  /*
   * Call when there's a chance that some feature got deleted. It runs through every sense and
   * quality removes any whose source is something that isn't found in the charsheet.
   *
   * DESIGN NOTES: As we go through things we're saving the items to be deleted into a list so
   *   we won't delete things in the middle of a loop. It would be nicer to just use array.filter()
   *   but that would return a NEW array and we want to modify the existing array because there
   *   are things that are storing references to the existing array and rendering UI stuff from it.
   */
  removeDeletedSenseStuff({addedSenses, addedSenseTypeQualities, addedSenseQualities, isActive}) {
    // --- Make lists of the things we are keeping ---
    const addedSenseHsids = addedSenses.map(x => x.hsid);
    const addedSenseTypeQualityHsids = addedSenseTypeQualities.map(x => x.hsid);
    const addedSenseQualityHsids = addedSenseQualities.map(x => x.hsid);
    // --- loop through the sense types ---
    const senseTypesToDelete = [];
    for (const senseType of Object.values(this.charsheet.senses)) {
      // --- delete senses derived from this power that are no longer supported ---
      const sensesToDelete = [];
      for (const sense of senseType.senses) {
        if (sense.sourceFeatureHsid === this.power.hsid && (!isActive || !addedSenseHsids.includes(sense.sourceHsid))) {
          sensesToDelete.push(sense);
        }
        // --- delete (sense) qualities derived from this power that are no longer supported ---
        const qualitiesToDelete = [];
        for (const quality of sense.qualities) {
          if (quality.sourceFeatureHsid === this.power.hsid && (!isActive || !addedSenseQualityHsids.includes(quality.sourceHsid))) {
            qualitiesToDelete.push(quality);
          }
        }
        for (const qualityToDelete of qualitiesToDelete) {
          sense.qualities.splice(sense.qualities.indexOf(qualityToDelete), 1); // delete it
        }
      }
      for (const senseToDelete of sensesToDelete) {
        senseType.senses.splice(senseType.senses.indexOf(senseToDelete), 1); // delete it
      }
      // --- delete (sense type) qualities derived from this power that are no longer supported ---
      const senseTypeQualitiesToDelete = [];
      for (const quality of senseType.qualities) {
        if (quality.sourceFeatureHsid === this.power.hsid && (!isActive || !addedSenseTypeQualityHsids.includes(quality.sourceHsid))) {
          senseTypeQualitiesToDelete.push(quality);
        }
      }
      for (const senseTypeQualityToDelete of senseTypeQualitiesToDelete) {
        senseType.qualities.splice(senseType.qualities.indexOf(senseTypeQualityToDelete), 1); // delete it
      }
      // --- check if the sense type should be deleted ---
      if (senseType.senses.length === 0 && senseType.qualities.length === 0) {
        // All senses and sense type qualities have been deleted; remove the sense type
        senseTypesToDelete.push(senseType);
      }
    }
    // --- Remove Sense Types that are now empty ---
    for (const senseTypeToDelete of senseTypesToDelete) {
      this.vm.$delete(this.charsheet.senses, senseTypeToDelete.name);
    }
  }

  destroy() {
    const calculationsIfGone = {
      addedSenses: [],
      addedSenseTypeQualities: [],
      addedSenseQualities: [],
      isActive: true
    };
    this.removeDeletedSenseStuff(calculationsIfGone);
    super.destroy();
  }
}


/*
 * Powers with a powerLayout of "selection" should auto-calculate their ranks and cost according
 * to what got selected.
 */
class SelectionPowerUpdater extends Updater {

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.power = newUpdaterEvent.power;
  }

  watchForChange() {
    return {
      identity: {
        powerExists: findFeatureByHsid(this.charsheet, this.power.hsid) !== null,
        powerEffect: this.power.effect,
      },
      calculations: {
        selections: this.power.extended.selectedFeatures,
        isActive: activationState(this.power).isActive,
      }
    };
  }

  applyChanges(newCalculations) {
    // -- Count up the ranks --
    const selectionLayout = selectionLayouts[this.power.effect];
    let ranks = 0;
    for (const selection of newCalculations.selections) {
      ranks += selectionLayout.selections[selection].ranks;
    }

    // -- IF it changed, set the ranks and the costs for the power --
    if (ranks !== this.power.ranks) {
      this.vm.$set(this.power, "ranks", ranks);
      // NOTE: I'm not sure passing [] to powerCostCalculate for extraModifierLists is accurate - that may be a bug
      // (if so, the bug exists for all of the other powers also).
      const calculatedFields = powerCostCalculate(this.power, getInheritedModifierLists(this.charsheet, this.power));
      this.vm.$set(this.power, "cost", calculatedFields.cost);
    }
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
    this.advantage = newUpdaterEvent.advantage;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const advantage = findAdvantageByHsid(charsheet, activeEffect.advantageHsid);
    if (advantage === null) {
      throw new ActiveEffectInvalid("Updater references hsid that isn't found.");
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


class CloseAttackUpdater extends ActiveEffectFromAdvantageUpdater {
  getActiveEffectKey() {
    return "attacks@close.check";
  }

  activeEffectValue() {
    return this.advantage.ranks;
  }

  getDescription() {
    return "Close Attack Advantage";
  }
}


class DefensiveRollUpdater extends ActiveEffectFromAdvantageUpdater {
  getActiveEffectKey() {
    return "defenses.toughness.ranks";
  }

  activeEffectValue() {
    return this.advantage.ranks;
  }

  getDescription() {
    return "Defensive Roll Advantage";
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


class RangedAttackUpdater extends ActiveEffectFromAdvantageUpdater {
  getActiveEffectKey() {
    return "attacks@ranged.check";
  }

  activeEffectValue() {
    return this.advantage.ranks;
  }

  getDescription() {
    return "Ranged Attack Advantage";
  }
}


class EnhancedTraitUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.power = newUpdaterEvent.power;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const feature = findFeatureByHsid(charsheet, activeEffect.powerHsid);
    if (feature === null) {
      throw new ActiveEffectInvalid("Updater references hsid that isn't found.");
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
      "Enhanced Toughness": "defenses.toughness.ranks",
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
        powerRanks: activationState(this.power).ranks,
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


/*
 * Abstract parent class for updaters that create an ActiveEffect based on
 * some Power.
 */
class ActiveEffectFromPowerUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.power = newUpdaterEvent.power;
    this.activeEffectKey = this.getActiveEffectKey();
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const feature = findFeatureByHsid(charsheet, activeEffect.powerHsid);
    if (feature === null) {
      throw new ActiveEffectInvalid("Updater references hsid that isn't found.");
    }
    return {updater: activeEffect.updater, power: feature};
  }


  /*
   * Subclasses must override this to return the key their active effect is stored under.
   */
  getActiveEffectKey() {
    throw Error("Subclasses must override this.");
  }

  /*
   * Given an ActiveEffect entry for an updater of this class, this returns
   * a boolean indicating whether it is the one belonging to this updater. We
   * only need to check if it's the right power.
   */
  isMyActiveEffect(activeEffect) {
    return activeEffect.powerHsid === this.power.hsid
  }

  /*
   * Subclasses must override this to return the result of a call to newAdjustment().
   */
  makeNewActiveEffect() {
    throw Error("Subclasses must override this.");
  }

  /*
   * Given the ranks of the power, this calculates the size of the effect. The
   * default implementation just uses the ranks of the power but subclasses may
   * override this.
   */
  effectSizeFromRanks(powerRanks) {
    return powerRanks;
  }

  /*
   * Subclasses must override this to provide a description to be displayed
   * (or null for "don't show this one").
   */
  getDescription() {
    throw new Error("Subclasses must override this.");
  }

  makeNewActiveEffect() {
    return newAdjustment(
      this.getDescription(),
      this.effectSizeFromRanks(activationState(this.power).ranks),
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
        powerRanks: activationState(this.power).ranks
      }
    };
  }

  /*
   * Calculates this.activeEffect.value, typically from the power ranks.
   */
  applyChanges(newCalculations) {
    this.activeEffect.value = this.effectSizeFromRanks(newCalculations.powerRanks);
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


class ProtectionUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "defenses.toughness.ranks";
  }
  getDescription() {
    return `Protection from ${this.power.name}`;
  }
}


class StrengthFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "abilities.strength.ranks";
  }
  getDescription() {
    return `Strength from Growth from ${this.power.name}`;
  }
}

class StaminaFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "abilities.stamina.ranks";
  }
  getDescription() {
    return `Stamina from Growth from ${this.power.name}`;
  }
}

class IntimidationFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "skills.skillList@intimidation";
  }
  effectSizeFromRanks(powerRanks) {
    return Math.floor(powerRanks / 2);
  }
  getDescription() {
    return `Intimidation from Growth from ${this.power.name}`;
  }
}

class StealthFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "skills.skillList@stealth";
  }
  effectSizeFromRanks(powerRanks) {
    return -powerRanks;
  }
  getDescription() {
    return `Stealth from Growth from ${this.power.name}`;
  }
}

class DodgeFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "defenses.dodge.ranks";
  }
  effectSizeFromRanks(powerRanks) {
    return -Math.ceil(powerRanks / 2);
  }
  getDescription() {
    return `Dodge from Growth from ${this.power.name}`;
  }
}

class ParryFromGrowthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "defenses.parry.ranks";
  }
  effectSizeFromRanks(powerRanks) {
    return -Math.ceil(powerRanks / 2);
  }
  getDescription() {
    return `Parry from Growth from ${this.power.name}`;
  }
}

class StrengthFromShrinkingUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "abilities.strength.ranks";
  }
  effectSizeFromRanks(powerRanks) {
    return -powerRanks;
  }
  getDescription() {
    return `Strength from Shrinking from ${this.power.name}`;
  }
}

class DodgeFromShrinkingUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "defenses.dodge.ranks";
  }
  effectSizeFromRanks(powerRanks) {
    return Math.floor(powerRanks / 2);
  }
  getDescription() {
    return `Dodge from Shrinking from ${this.power.name}`;
  }
}

class ParryFromShrinkingUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "defenses.parry.ranks";
  }
  effectSizeFromRanks(powerRanks) {
    return Math.floor(powerRanks / 2);
  }
  getDescription() {
    return `Parry from Shrinking from ${this.power.name}`;
  }
}

class StealthFromShrinkingthUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "skills.skillList@stealth";
  }
  getDescription() {
    return `Stealth from Shrinking from ${this.power.name}`;
  }
}

class IntimidationFromShrinkingUpdater extends ActiveEffectFromPowerUpdater {
  getActiveEffectKey() {
    return "skills.skillList@intimidation";
  }
  effectSizeFromRanks(powerRanks) {
    return -Math.floor(powerRanks / 2);
  }
  getDescription() {
    return `Intimidation from Shrinking from ${this.power.name}`;
  }
}




class CombatSkillUpdater extends Updater {
  constructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super(vm, charsheet, newUpdaterEvent, ...otherArgs);
  }

  setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs) {
    super.setMoreFieldsInConstructor(vm, charsheet, newUpdaterEvent, ...otherArgs);
    this.skill = newUpdaterEvent.skill;
    this.activeEffectKey = `attacks.${this.skill.attackHsid}.check`;
    this.activeEffect = findOrCreateUpdaterActiveEffect(this);
  }

  static updateEventFromActiveEffect(vm, charsheet, activeEffect) {
    const skill = findSkillByHsid(charsheet, activeEffect.skillHsid);
    if (skill === null) {
      throw new ActiveEffectInvalid("Updater references hsid that isn't found.");
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
        featureCost: this.item.feature.cost
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
      attacks[attack.hsid] = attack;
    });
    const normalSkills = {};
    const templateSkills = {};
    this.charsheet.skills.skillList.forEach(skill => {
      if (skill.isTemplate) {
        templateSkills[skill.hsid] = skillRoll(this.charsheet, skill);
      } else {
        normalSkills[skill.name] = skillRoll(this.charsheet, skill);
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
      // Handle attacks
      const attack = calcs.attacks[hsid];
      const info = attackRollInfo(this.charsheet, attack);
      if (info.isAttack && info.isAllowed) {
        if (info.hasAttackRoll) {
          // Rule: attackCheck + effectRank <= 2 * powerLevel
          if (!isNaN(info.attackRoll) && !isNaN(info.ranks)) {
            if (info.attackRoll + info.ranks > 2 * calcs.powerLevel) {
              const key = `AttackRoll@${hsid}`;
              newV[key] = constraintValue(key);
            }
          }
        } else {
          // Rule: effectRank <= powerLevel
          if (!isNaN(info.ranks)) {
            if (info.ranks > calcs.powerLevel) {
              const key = `AttackRoll@${hsid}`;
              newV[key] = constraintValue(key);
            }
          }
        }
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
  ThrownAttackUpdater,
  PowerAttackUpdater,
  MoveObjectThrownAttackUpdater,
  SensesPowerUpdater,
  SelectionPowerUpdater,
  CloseAttackUpdater,
  DefensiveRollUpdater,
  ImprovedInitiativeUpdater,
  JackOfAllTradesUpdater,
  RangedAttackUpdater,
  EnhancedTraitUpdater,
  ProtectionUpdater,
  StrengthFromGrowthUpdater,
  StaminaFromGrowthUpdater,
  IntimidationFromGrowthUpdater,
  DodgeFromGrowthUpdater,
  ParryFromGrowthUpdater,
  StealthFromGrowthUpdater,
  StrengthFromShrinkingUpdater,
  DodgeFromShrinkingUpdater,
  ParryFromShrinkingUpdater,
  StealthFromShrinkingthUpdater,
  IntimidationFromShrinkingUpdater,
  CombatSkillUpdater,
  EquipmentFeatureUpdater,
  AllyUpdater,
  ConstraintUpdater,
};


/*
 * An exception class used when creating an active effect and the effect turns out
 * to be invalid in some way such as referencing a source that isn't in the charsheet
 * or an updater type that doesn't exist.
 */
class ActiveEffectInvalid extends Error {
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
 * ActiveEffectInvalid.
 */
const newUpdaterFromActiveEffect = function(vm, charsheet, activeEffect) {
  const updaterType = activeEffect.updater;
  const updaterClass = updaterClasses[updaterType];
  if (updaterClass === undefined || !("updateEventFromActiveEffect" in updaterClass)) {
    throw new ActiveEffectInvalid(`Unsupported updater type '${updaterType}' in activeEffect.`);
  }
  const updateEvent = updaterClass.updateEventFromActiveEffect(vm, charsheet, activeEffect);
  return new updaterClasses[updaterType](vm, charsheet, updateEvent);
};


export {
  updaterClasses,
  newUpdaterFromActiveEffect,
  ActiveEffectInvalid,
};
