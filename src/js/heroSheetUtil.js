/*
 * File with miscellaneous functions used various places in the program.
 *
 * FIXME: This file is getting pretty big. I should consider breaking it
 *   up into smaller pieces.
 */

import Vue from 'vue'
import {newBlankPower, newHsid, findContainingArrayByHsid} from "@/js/heroSheetVersioning.js";

const standardAdvantages = require("@/data/standardAdvantages.json");
const standardPowers = require("@/data/standardPowers.json");
const modifiersData = require("@/data/modifiersData.json");
const skillsData = require("@/data/skillsData.json");


/*
 * Given a string, this capitalizes the first letter.
 */
const capitalize = function(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
};


const fieldAllowedRegEx = {
  user: "^(|[a-zA-Z0-9$@._+-]+)$",
  email: "^(|[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$",
  password: "^(.{4,})$"
};

function isArray(power) {
  if (power.effect === "") { // dummy used for new powers that don't have an effect set yet
    return false;
  }
  const standardPower = standardPowers[power.effect];
  if (!standardPower) {
    throw new Error(`Power effect '${power.effect}' is not a standard power.`);
  }
  return standardPower.powerLayout === 'array';
}


/*
 * Given a member of the enum for range, this returns an integer. Any other value
 * will return undefined.
 */
const rangeToInt = function(range) {
  const mapping = {
    personal: 0,
    close: 1,
    ranged: 2,
    perception: 3
  };
  return mapping[range];
}

/*
 * Given an integer, this returns a member of the range array. Numbers outside the range 0..3 will
 * be truncated to fit.
 */
const intToRange = function(n) {
  const values = ["personal", "close", "ranged", "perception"];
  return values[Math.min(Math.max(0, n), 3)];
}


/*
 * Determines the base cost feature. Returns NaN if the power is not selected
 * or the cost depends on an option and the option isn't selected. Returns
 * null if the power is an array power.
 */
const powerBaseCost = function(feature) {
  const standardPower = getStandardPower(feature);
  if (standardPower === null) {
    return NaN; // invalid
  } else  if (standardPower.powerLayout === "array") {
    return null; // meaningless
  } else if (standardPower.powerOptions) {
    const powerOption = getPowerOption(feature);
    if (powerOption === null) {
      return NaN; // invalid
    } else {
      return powerOption.baseCost;
    }
  } else {
    return standardPower.baseCost;
  }
}


/*
 * This contains the formulas to calculate the cost of a power.
 *
 * As input it takes two required parameters. The first is the power to
 * be analyzed. The second, inheritedModifierLists, is a list of lists of
 * modifiers applied by ancestors (arrays this is embedded in); it can be
 * passed as [] if there are no modifiers. A caller can use getInheritedModifierLists()
 * to obtain this value if needed.
 *
 * It has one optional parameter: activeRanks is a number of ranks for
 * which the power's cost is to be evaluated; if omitted or null then the
 * number of ranks of the power is used.
 *
 * As output it returns an object -- one field is the cost, but there are
 * other fields for intermediate values that we might want to display.
 */
const powerCostCalculate = function(power, inheritedModifierLists, activeRanks=null) {
  // --- Validate ---
  if (!(inheritedModifierLists instanceof Array)) {
    throw new Error(`inheritedModifierLists must be an array of arrays, but was ${inheritedModifierLists}.`);
  }

  // --- Deal with optional argument ---
  const effectiveRanks = activeRanks === null ? power.ranks : activeRanks;

  // --- Calculate multipliers & adders from all modifiers ---
  let extrasMultiplier = 0;
  let flawsMultiplier = 0;
  const allModifierLists = [power.extras, power.flaws, ...inheritedModifierLists];
  for (const modifierList of allModifierLists) {
    for (const modifier of modifierList) {
      if (modifier.costType === "pointsOfMultiplier") {
        if (modifier.cost < 0) {
          flawsMultiplier += modifier.cost;
        } else {
          extrasMultiplier += modifier.cost;
        }
      } else if (modifier.costType === "pointsOfMultiplierPerRankOfModifier") {
        if (modifier.cost < 0) {
          flawsMultiplier += modifier.cost * modifier.ranks;
        } else {
          extrasMultiplier += modifier.cost * modifier.ranks;
        }
      }
    }
  }

  // --- Flat adders and flatPer5 figure in only if they are NOT inherited ---
  let normalFlatAdder = 0;
  let flatPer5FinalPoints = 0;
  const ownModifierLists = [power.extras, power.flaws];
  for (const modifierList of ownModifierLists) {
    for (const modifier of modifierList) {
      if (modifier.costType === "flatPoints") {
        normalFlatAdder += modifier.cost;
      } else if (modifier.costType === "flatPointsPerRankOfModifier") {
        normalFlatAdder += modifier.cost * modifier.ranks;
      } else if (modifier.costType === "flatPointsPer5PointsOfFinalCost") {
        flatPer5FinalPoints += modifier.cost;
      }
    }
  }

  const subpowers = power.subpowers;
  const numberOfSubpowers = subpowers.length;
  let cost;
  let flatAdder;
  if ((isArray(power) && numberOfSubpowers === 0) || (!isArray(power) && effectiveRanks === 0)) {

    // --- Special case of non-existent powers ---
    cost = 0;
    flatAdder = normalFlatAdder;

  } else {

    // --- Calculate the costBeforeFlats ---
    let costBeforeFlats;
    if (isArray(power)) {
      const subpowerCosts = subpowers.map(x => x.cost);
      const largestSubpowerCost = Math.max(...subpowerCosts);
      if (power.effect === "Linked") {
        costBeforeFlats = subpowerCosts.reduce((x,y) => x + y, 0);
      } else if (power.effect === "Alternate") {
        costBeforeFlats = largestSubpowerCost + (numberOfSubpowers - 1);
      } else if (power.effect === "Dynamic") {
        costBeforeFlats = largestSubpowerCost + 2 *(numberOfSubpowers - 1) + 1;
      } else {
        throw new Error(`Unsupported array power of '${power.name}'.`)
      }
      flatAdder = normalFlatAdder; // no easy way to display values from a per-5-pts on the array
    } else {
      const modifiedCostPerRank = powerBaseCost(power) + extrasMultiplier + flawsMultiplier;
      costBeforeFlats = modifiedCostPerRank >= 1
        ? modifiedCostPerRank * effectiveRanks
        : Math.ceil(effectiveRanks / (2 - modifiedCostPerRank));
    }

    // --- Calculate the cost (and flatAdder) ---
    const costWithNormalAdder = Math.max(1, costBeforeFlats + normalFlatAdder);
    const finalAdjustment = Math.round((costWithNormalAdder / 5) * flatPer5FinalPoints);
    cost = Math.max(1, costBeforeFlats + normalFlatAdder + finalAdjustment);
    flatAdder = cost - costBeforeFlats;
  }

  // --- Return result object ---
  return {
    cost,
    extrasMultiplier,
    flawsMultiplier,
    flatAdder,
  };
};


/*
 * This method is given a power and it finds and returns the list of modifier lists
 * for all ancestor arrays. Its primary use is for obtaining the parameter needed by
 * powerCostCalculate().
 */
const getInheritedModifierLists = function(charsheet, power) {
  const parentArray = findContainingArrayByHsid(charsheet, power.hsid)
  if (parentArray === undefined) {
  }
  if (parentArray === null) {
    return [];
  } else {
    const inheritedModifierLists = getInheritedModifierLists(charsheet, parentArray);
    return [power.extras, power.flaws, ...inheritedModifierLists];
  }
}


/*
 * Given an advantage, this will return true if that advantage has ranks and
 * false if it is the kind that doesn't. It returns false if the
 * advantage is not one of the known kinds.
 */
const advantageIsRanked = function(advantage) {
  const standardAdvantage = standardAdvantages[advantage.name];
  return standardAdvantage ? standardAdvantage.isRanked : false;
};


const costOfAbility = function(charsheet, statName) {
  const statData = charsheet.abilities[statName];
  if (statData.entered === "lack") {
    return -10;
  }
  if (statData.entered === "construct") {
    return 0;
  }
  if (charsheet.misc.isMindlessConstruct && ["strength", "intellect", "presence"].includes(statName)) {
    return (statData.entered + 5) * 2;
  }
  if (charsheet.misc.isImmobileConstruct && ["strength", "stamina", "agility"].includes(statName)) {
    return (statData.entered + 5) * 2;
  }
  return statData.entered * 2;
};


const abilityCost = function(charsheet) {
  return Object.entries(charsheet.abilities).reduce((x,y) => x + costOfAbility(charsheet, y[0]), 0);
};

const defenseCost = function(charsheet) {
  return Object.values(charsheet.defenses).reduce((x,y) => x + y.cost, 0);
};

const skillCost = function(charsheet) {
  return charsheet.skills.cost
};

const advantageCost = function(charsheet) {
  return charsheet.advantages.reduce((x,y) => x + (advantageIsRanked(y) ? y.ranks : 1), 0);
};

const equipmentCost = function(charsheet) {
  const totalEQ = charsheet.equipment.reduce((x,y) => x + y.cost, 0);
  return Math.ceil(totalEQ / 5);
}

const powerCost = function(charsheet) {
  return Object.values(charsheet.powers).reduce((x,y) => x + y.cost, 0);
};

const totalCost = function(charsheet) {
  return abilityCost(charsheet) + defenseCost(charsheet) + skillCost(charsheet) +
    advantageCost(charsheet) + equipmentCost(charsheet) + powerCost(charsheet);
};

const availablePoints = function(charsheet) {
  return charsheet.campaign.powerLevel * 15 + charsheet.campaign.xpAwarded;
};

const costOutOfSpec = function(charsheet) {
  return totalCost(charsheet) > availablePoints(charsheet);
};


/*
 * Given a charsheet and the information needed to identify a skill, this returns the
 * roll for that skill. It will return NaN if any of the inputs are NaN. If the skill
 * does not allow a roll or if the skill specified is not found it will return null.
 *
 * Specifying the skill is an object that contains a boolean named isTemplate and, if
 * isTemplate contains a field named hsid or if !isTemplate contains a field named name.
 * A skill object from the charsheet will satisfy these requirements.
 */
const skillRoll = function(charsheet, skillSpecifier) {
  const {isTemplate, name, hsid} = skillSpecifier;
  const skill = charsheet.skills.skillList.find(x => isTemplate ? x.hsid === hsid : x.name === name);
  if (skill === undefined) {
    return null;
  }
  const activeEffectKey = isTemplate
    ? `skills.skillList#${hsid}`
    : `skills.skillList@${name}`;
  const ranksFromActiveEffects = activeEffectModifier(charsheet, activeEffectKey);
  const isJackOfAllTrades = activeEffectModifier(charsheet, "jackOfAllTrades") > 0;
  const skillData = isTemplate ? skillsData.templateSkills[skill.name] : skillsData.normalSkills[name];
  if (skillData === undefined) {
    // It is some kind of a dummy skill, so we return null
    return null;
  }
  const rollAllowed = skillData.useUntrained || isJackOfAllTrades || skill.ranks > 0 || ranksFromActiveEffects > 0;
  if (rollAllowed) {
    const baseValue = charsheet.abilities[skillData.ability].ranks;
    return baseValue + skill.ranks + ranksFromActiveEffects;
  } else {
    return null;
  }
}


/*
 * Just a subroutine of findModifierItemTemplate.
 */
const _findModifierItem = function(thingWithExtrasAndFlaws, modifierSource, modifierName, optionName) {
  const allModifiers = thingWithExtrasAndFlaws.extras.concat(thingWithExtrasAndFlaws.flaws);
  const possibleModifiers = allModifiers.filter(x => x.name === modifierName);
  if (possibleModifiers.length === 1) {
    const modifier = possibleModifiers[0];
    if (optionName) {
      if (modifier.modifierOptions) {
        const possibleOptions = modifier.modifierOptions.filter(x => x.name === optionName);
        if (possibleOptions.length === 1) {
          const option = possibleOptions[0];
          return option;
        } else if (possibleOptions.length === 0) {
          throw new Error(`Standard modifier '${modifierName}' has no option named '${optionName}'.`);
        } else {
          throw new Error(`Standard modifier '${modifierName}' has multiple options named '${optionName}'.`);
        }
      } else {
        throw new Error(`Standard modifier '${modifierName}' has no options.`);
      }
    } else {
      return modifier;
    }
  } else if (possibleModifiers.length === 0) {
    throw new Error(`No standard modifier named '${modifierName}'.`);
  } else {
    throw new Error(`Multiple standard modifiers named '${modifierName}'.`);
  }
}

/*
 * Given the fields that identify a modifier template, this locates it. The field
 * effect is a power name; needed only if the modifierSource is "special".
 */
const findModifierItemTemplate = function(modifierSource, modifierName, optionName=null, effect=null) {
  if (modifierSource === "standard") {
    return _findModifierItem(modifiersData, modifierSource, modifierName, optionName);
  } else if (modifierSource === "special") {
    if (effect) {
      const standardPower = standardPowers[effect];
      return _findModifierItem(standardPower, modifierSource, modifierName, optionName);
    } else {
      throw new Error(`Must specify an effect with a modifierSource of '${modifierSource}'.`);
    }
  } else {
    throw new Error(`Unsupported modifierSource of '${modifierSource}'.`);
  }
}

/*
 * This is passed a template for a Feature and it creates a new
 * feature. A Feature is basically a power, but it might be
 * attached to something different like a piece of equipment.
 */
const buildFeature = function(template, inheritedModifierLists) {
  const feature = newBlankPower();
  feature.name = template.name || template.effect;
  feature.description = template.description || "";
  feature.ranks = template.ranks || 1;
  setPowerEffect(feature, inheritedModifierLists, template.effect);
  if (template.option) {
    setPowerOption(feature, inheritedModifierLists, template.option);
  }
  for (const modifierType of ["extras", "flaws"]) {
    for (const modifierTemplate of template[modifierType] || []) {
      const {
        modifierSource,
        modifierName,
        optionName,
        ranks
      } = modifierTemplate;
      const modifier = buildNewModifier({
        modifierSource,
        modifierName,
        optionName,
        effect: template.effect,
        ranks
      });
      addPowerModifier(feature, inheritedModifierLists, modifierType, modifier)
    }
  }
  if (template.subpowers) {
    for (const subpowerTemplate of template.subpowers) {
      const subpowerInheritedModifierList = [feature.extras, feature.flaws, ...inheritedModifierLists];
      const subpower = buildFeature(subpowerTemplate, subpowerInheritedModifierList);
      feature.subpowers.push(subpower);
    }
  }
  recalculatePowerCost(feature, inheritedModifierLists);
  return feature;
};

/*
 * Given a Power object from the charsheet, this returns the corresponding
 * StandardPower for its effect OR returns null if there isn't a valid
 * one.
 */
const getStandardPower = function(power) {
  return standardPowers[power.effect] || null;
};

/*
 * Given a Power object from the charsheet, this returns the corresponding
 * option that is selected OR returns null there isn't a valid selection.
 */
const getPowerOption = function(power) {
  const standardPower = getStandardPower(power);
  if (standardPower && standardPower.powerOptions) {
    const result = standardPower.powerOptions[power.option];
    if (result === undefined) {
      return null;
    } else {
      return result;
    }
  } else {
    return null;
  }
};


/*
 * Given a Power object from the charsheet, this re-calculates the cost
 * field.
 */
const recalculatePowerCost = function(power, inheritedModifierLists) {
  power.cost = powerCostCalculate(power, inheritedModifierLists).cost;
};

/*
 * Given a Power object from the charsheet and a feature, this copies
 * the feature over into the power and replaces whatever it used to
 * contain with the fields of the feature.
 */
const replacePower = function(power, inheritedModifierLists, feature) {
  for (const [fieldName, fieldValue] of Object.entries(feature)) {
    Vue.set(power, fieldName, fieldValue);
  }
  recalculatePowerCost(power, inheritedModifierLists);
}


/*
 * Given a Power object from the charsheet and a new effect string, this
 * alters the effect and then re-calculates all the fields of the Power
 * object that depend on the effect.
 */
const setPowerEffect = function(power, inheritedModifierLists, effect) {
  power.effect = effect;
  const standardPower = getStandardPower(power);
  if (standardPower !== null) {
    Vue.set(power, "option", standardPower.powerOptions ? "" : null);
    if (standardPower.powerLayout !== "array") {
      Vue.set(power, "subpowers", []);
    }
    // Remove any extended fields
    for (const field in power.extended) {
      Vue.delete(power.extended, field);
    }
    if (standardPower.powerLayout === "senses") {
      // Add extended fields
      Vue.set(power.extended, "addedSenses", []);
      Vue.set(power.extended, "addedSenseTypeQualities", []);
      Vue.set(power.extended, "addedSenseQualities", []);
    } else if (standardPower.powerLayout === "affliction") {
      // Add extended fields
      Vue.set(power.extended, "conditionsApplied", [["", "", ""]]);
      Vue.set(power.extended, "alternateResistance", "");
      Vue.set(power.extended, "resistWith", "");
    }
  }
  recalculatePowerCost(power, inheritedModifierLists);
}

/*
 * Given a Power object from the charsheet and a new option string, this
 * alters the effect and then re-calculates all the fields of the Power
 * object that depend on the effect.
 */
const setPowerOption = function(power, inheritedModifierLists, option) {
  power.option = option;
  recalculatePowerCost(power, inheritedModifierLists);
}

/*
 * Given a power, a modifierType ("extras" or "flaws"), and the new
 * modifier, this adds the modifier and updates costs accordingly
 * on the power. The data for a modifier looks like this:
 *
 * {
 *   modifierSource: xxx
 *   modifierName: xxx,
 *   optionName: xxx,   // if (this.selectedModifierHasOptions)
 *   ranks: 2,          // if not selectedItem.hasRanks then this is null
 *   costType: xxx,
 *   cost: xxx,
 *   displayText: xxx
 * }
 */
const addPowerModifier = function(power, inheritedModifierLists, modifierType, modifier) {
  power[modifierType].push(modifier);
  power.cost = powerCostCalculate(power, inheritedModifierLists).cost
}

/*
 * Delete a modifier from a particular power.
 */
const deletePowerModifier = function(power, inheritedModifierLists, modifierType, modifier) {
  const modifierList = power[modifierType];
  const index = modifierList.indexOf(modifier);
  if (index !== -1) {
    modifierList.splice(index, 1);
    power.cost = powerCostCalculate(power, inheritedModifierLists).cost;
  }
}

/*
 * Given a modifier template (without options) or modifier option template
 * and the number of ranks to be purchased (defaults to null, which is
 * appropriate if the modifier does not have ranks), this returns the text
 * used to display the sign of the modifier. If null is provided for the
 * modifierItemTemplate it returns "".
 */
const modifierDisplaySign = function(modifierItemTemplate, ranks=null) {
  if (modifierItemTemplate) {
    const costShown = modifierItemTemplate.cost * (modifierItemTemplate.hasRanks ? ranks : 1);
    const sign = costShown > 0 ? "+" : ""; // negatives have the sign built in
    const text = {
      flatPoints: " flat",
      flatPointsPerRankOfModifier: " flat",
      flatPointsPer5PointsOfFinalCost: " fifths",
      pointsOfMultiplier: "",
      pointsOfMultiplierPerRankOfModifier: ""
    }[modifierItemTemplate.costType];
    return `(${sign}${costShown}${text})`;
  } else {
    return "";
  }
}

/*
 * Given a modifier template (without options) or modifier option template
 * and the number of ranks to be purchased (defaults to null, which is
 * appropriate if the modifier does not have ranks), this returns the text
 * used to display the modifier. If null is provided for the
 * modifierItemTemplate it returns "".
 */
const modifierDisplayText = function(modifierItemTemplate, ranks=null) {
  if (modifierItemTemplate) {
    const name = modifierItemTemplate.name;
    return `${name} ${modifierDisplaySign(modifierItemTemplate, ranks)}`;
  } else {
    return "";
  }
};

/*
 * Construct a new modifier (object in a charsheet). Required fields are
 * numerous: modifierSource is "standard" or "special", telling where the
 * modifier came from, modifierName is the name of the extra or flaw, and
 * optionName is null or is the name of the option. All of those are used
 * only to find the modifier if it needs to be edited or have special
 * properties -- which they don't have now.
 *
 * Also needed are modifierItemTemplate, which should be a modifier template that
 * does not have options OR an option template, and ranks, which is the
 * number of ranks of the modifier to purchase or null if the modifier
 * does not have ranks.
 */
const buildNewModifier = function(inputFields) {
  const {
    modifierSource,          // Required. "standard" or "special"
    modifierName,            // Required.
    optionName,              // Required if the modifier has options
    effect,                  // The power effect it is based on. Required if modifierSource is "special"
    ranks                    // Required if the modifier has ranks
  } = inputFields;
  const modifierItemTemplate = findModifierItemTemplate(modifierSource, modifierName, optionName, effect);
  return {
    modifierSource: modifierSource,
    modifierName: modifierName,
    optionName: optionName,
    ranks: ranks,
    costType: modifierItemTemplate.costType,
    cost: modifierItemTemplate.cost,
    displayText: modifierDisplayText(modifierItemTemplate, ranks)
  };
}

const POWER_TO_UPDATERS_MAP = {
  "Damage": ["PowerAttackUpdater"],
  "Affliction": ["PowerAttackUpdater"],
  "Nullify": ["PowerAttackUpdater"],
  "Weaken": ["PowerAttackUpdater"],
  "Move Object": ["MoveObjectThrownAttackUpdater"],
  "Enhanced Trait": ["EnhancedTraitUpdater"],
  "Protection": ["ProtectionUpdater"],
  "Growth": [
    "StrengthFromGrowthUpdater",
    "StaminaFromGrowthUpdater",
    "IntimidationFromGrowthUpdater",
    "DodgeFromGrowthUpdater",
    "ParryFromGrowthUpdater",
    "StealthFromGrowthUpdater",
  ],
  "Shrinking": [
    "StrengthFromShrinkingUpdater",
    "DodgeFromShrinkingUpdater",
    "ParryFromShrinkingUpdater",
    "StealthFromShrinkingthUpdater",
    "IntimidationFromShrinkingUpdater",
  ],
  "Senses": [
    "SensesPowerUpdater",
  ]
};

/*
 * Given a power (or feature), this returns the event payload needed to create
 * a new updater for that power, or returns null if this power does not require
 * any updater.
 */
const powerUpdaterEvents = function(charsheet, power) {
  // NOTE: I'll allow ONE special case, but if I ever get a second one I'll re-design so it isn't special
  // Special case: Enhanced Trait shouldn't have an updater if the option is "Other Enhanced Trait".
  if (power.effect === "Enhanced Trait" && power.option === "Other Enhanced Trait") {
    return [];
  }

  const updaters = POWER_TO_UPDATERS_MAP[power.effect];
  if (updaters === undefined) {
    return [];
  }
  return updaters.map(updater => {
    return {
      charsheet,
      updater,
      power,
    };
  });
}


const createUpdatersForFeature = function($globals, charsheet, feature) {
  const events = powerUpdaterEvents(charsheet, feature);
  for (const event of events) {
    $globals.eventBus.$emit("new-updater", event);
  }
  feature.subpowers.forEach(x => createUpdatersForFeature($globals, charsheet, x));
}


/*
 * This adds a given activeEffect to the charsheet under the specified activeEffectKey.
 */
const addActiveEffect = function(charsheet, activeEffectKey, activeEffect) {
  if (!charsheet.activeEffects[activeEffectKey]) {
    Vue.set(charsheet.activeEffects, activeEffectKey, []);
  }
  const activeEffects = charsheet.activeEffects[activeEffectKey];
  activeEffects.push(activeEffect);
}

/*
 * This removes activeEffects. test should be a function taking an activeEffect,
 * an activeEffectKey, and returning true to delete the active effect or false
 * to keep it. Also activeEffectKey can be provided to search only within a
 * given key or can be omitted to search all active effects.
 */
const removeActiveEffects = function(charsheet, test, activeEffectKey = null) {
  if (activeEffectKey === null) {
    for (const key in charsheet.activeEffects) {
      removeActiveEffects(charsheet, test, key);
    }
  } else {
    const activeEffects = charsheet.activeEffects[activeEffectKey];
    if (activeEffects) {
      let i = activeEffects.length;
      while (i > 0) {
        i = i - 1;
        const activeEffect = activeEffects[i];
        if (test(activeEffect, activeEffectKey)) {
          activeEffects.splice(i, 1);
          if (activeEffects.length === 0) {
            Vue.delete(charsheet.activeEffects, activeEffectKey);
          }
        }
      }
    }
  }
}


/*
 * Attempts to locate a matching activeEffect and return it. If none is found,
 * will instead create a new activeEffect, store it, and then return it.
 *
 * charsheet is the charsheet
 * test is a function accepting an activeEffect and returning true if it is
 *   the effect being searched for and false if not. Exactly one active
 *   effect should match, or it will throw an error.
 * create is a function taking no parameters and returning the new active
 *   effect which will be called if no matching activeEffect is found.
 * activeEffectKey is the key to use -- this is a required parameter because
 *   we need to know where to store the effect in case it has to be created.
 */
const findOrCreateActiveEffect = function(charsheet, activeEffectKey, test, create) {
  if (charsheet.activeEffects[activeEffectKey] === undefined) {
    Vue.set(charsheet.activeEffects, activeEffectKey, []);
  }
  const possibleActiveEffects = charsheet.activeEffects[activeEffectKey];
  const matchingActiveEffects = possibleActiveEffects.filter(test);
  if (matchingActiveEffects.length > 1) {
    throw new Error(`Multiple active effects that matched.`);
  } else if (matchingActiveEffects.length === 1) {
    // The activeEffect entry exists. Return it.
    return matchingActiveEffects[0];
  } else {
    // The activeEffect entry does not exist. Create it (and return it).
    const newActiveEffect = create();
    possibleActiveEffects.push(newActiveEffect);
    return newActiveEffect;
  }
}


/*
 * Given a key for an active effect, this sums the total value of all active
 * activeEffects for that key and returns the total.
 */
const activeEffectModifier = function(charsheet, activeEffectKey) {
  const pertinentActiveEffects = charsheet.activeEffects[activeEffectKey] || [];
  const total = pertinentActiveEffects.reduce(
      (sum, activeEffect) => sum + (activeEffect.isActive ? 1 : 0) * activeEffect.value,
      0
  );
  return total;
}


/*
 * Returns true if the given activeEffectKey has an active effect that is a
 * manual adjustment and false otherwise.
 */
const isManuallyAdjusted = function(charsheet, activeEffectKey) {
  const activeEffects = charsheet.activeEffects[activeEffectKey];
  if (activeEffects) {
    for (const activeEffect of activeEffects) {
      if (activeEffect.isManualAdjustment) {
        return true;
      }
    }
  }
  return false;
}


/*
 * Returns true if the character lacks the given stat (rather than having a value). A invalid
 * value (eg: NaN) is NOT a lack, but "lack" is.
 */
const lacksStat = function(charsheet, statName) {
  const statObj = charsheet.abilities[statName];
  const entered = statObj.entered;
  if (typeof(entered) === "string") {
    return true;
  } else if (typeof(entered) === "number") {
    return false;
  } else if (statObj.entered === null) {
    return false;
  } else {
    throw new Error(`The entered ranks for ${statName} are '${entered}' which is an unexpected type.`);
  }
}

/*
 * Given a FlexibleInteger (which can be an integer, NaN, or null) this returns a numeric
 * value which is either an integer or NaN (by concerting null to NaN). The result is still
 * a FlexibleInteger, BUT one on which we can perform arithmatic and it behaves as desired.
 */
const nullReset = function(x) {
  return x === null ? NaN : x;
}

/*
 * This is given a charsheet and an attack and returns an object with several values:
 *   isAttack: a boolean telling whether or not it simply isn't an attack (eg: personal range)
 *   isAllowed: if isAttack, a boolean telling whether the attack is simply not permitted (lacks a needed stat)
 *   ranks: if isAllowed, a FlexibleInteger (which won't be null) giving the number of ranks of the attack effect (including strength)
 *   ranksSource: if isAllowed, a string describing the source of the ranks
 *   hasAttackRoll: if isAllowed, a boolean telling whether the attack has an attack roll (not area or perception)
 *   attackRoll: if hasAttackRoll, a FlexibleInteger (which won't be null) giving the amount for the attack roll
 *   attackRollSource: if hasAttackRoll, a string describing the source of the attack roll
 *   isPerception: if !hasAttackRoll, a boolean telling whether the attack has perception range
 *   isArea: if !hasAttackRoll, a boolean telling whether the scope is area (= !hasAttackRoll && !isPerception)
 */
const attackRollInfo = function(charsheet, attack) {
  const isAttack = attack.range !== "personal";
  if (!isAttack) {
    return { isAttack };
  }
  const isPerception = attack.range === "perception";
  const isArea = attack.scope === "area";
  const hasAttackRoll = !isPerception && ! isArea;
  const isStrengthBased = attack.isStrengthBased;
  const [keyStat, keyStatDisplay] = (attack.range === 'close'
    ? ['fighting', 'Fighting']
    : (
      attack.range === "ranged"
        ? ['dexterity', 'Dexterity']
        : [null, null]
    )
  );
  const isAllowed = !(isStrengthBased && lacksStat(charsheet, "strength") || (
    hasAttackRoll && lacksStat(charsheet, keyStat)
  ));
  if (!isAllowed) {
    return { isAttack, isAllowed };
  }
  const ranks = nullReset(attack.ranks) + (isStrengthBased ? nullReset(charsheet.abilities.strength.ranks) : 0);
  const ranksSource = isStrengthBased ? "Ranks + Strength" : "Ranks";
  if (!hasAttackRoll) {
    return { isAttack, isAllowed, ranks, ranksSource, hasAttackRoll, isPerception, isArea };
  }
  const keyStatValue = charsheet.abilities[keyStat].ranks;
  const attackRoll = nullReset(keyStatValue) + nullReset(attack.attackCheckAdjustment);
  const hasAdjustment = attack.attackCheckAdjustment !== 0;
  const attackRollSource = hasAdjustment ? `${keyStatDisplay} + Skill` : keyStatDisplay;
  return { isAttack, isAllowed, ranks, ranksSource, hasAttackRoll, attackRoll, attackRollSource };
}


/*
 * Returns the number of ranks currently active on this power.
 */
const getActiveRanks = function(power) {
  const status = power.activation.activationStatus;
  return status === "off" ? 0 : (status === "on" ? power.ranks : power.activation.ranks);
}


/*
 * This is a subroutine of setFeatureActivation for dealing with dynamic arrays. It is
 * given a dynamic array and examines it's current activation status. If the current
 * state of activation means that the dynamic array is overspent, this returns the amount
 * by which it is overspent. If not, then this returns 0. If something is NaN then
 * this will return 0.
 *
 * dynamicArray is the array and inheritedModifierLists is the correct list for the
 * CHILDREN of the array.
 */
const dynamicArrayOverspendAmount = function(dynamicArray, inheritedModifierLists) {
  let mostExpensiveCost = 0;
  let totalActiveCost = 0;
  for (const subpower of dynamicArray.subpowers) {
    const activeRanks = getActiveRanks(subpower);
    const activeCost = powerCostCalculate(subpower, inheritedModifierLists, activeRanks).cost;
    totalActiveCost += activeCost;
    const fullCost = subpower.cost;
    if (fullCost > mostExpensiveCost) {
      mostExpensiveCost = fullCost;
    }
  }
  if (totalActiveCost > mostExpensiveCost) {
    return totalActiveCost - mostExpensiveCost;
  } else {
    return 0;
  }
}


/*
 * This is called when the activation on a feature is altered. action should be "on" (the power is
 * turned on), "off" (the power is turned off), "partial" (the power is switched into partially-active
 * mode), "incr" (the power is increased by 1 rank), or "decr" (the power is decreased by 1 rank). The
 * function will update the feature (power) but ALSO will update related features like child
 * features or siblings within the same array.
 *
 * The argument comingFrom is only used for recursion. Allowed values are "self" (for the non-recursive
 * call), "parent", "sibling", or "child" and they indicate the relationship of the triggering power
 * to this one.
 */
const setFeatureActivation = function(charsheet, power, inheritedModifierLists, action, comingFrom="self") {

  // --- Validate Inputs ---
  if (!["on", "off", "partial", "incr", "decr"].includes(action)) {
    throw new Error(`Invalid input to setFeatureActivation(): action = "${action}".`)
  }
  if (!["self", "parent", "child", "sibling"].includes(comingFrom)) {
    throw new Error(`Invalid input to setFeatureActivation(): comingFrom = "${comingFrom}".`)
  }

  // --- If this isn't a real power, just exit ---
  const standardPower = getStandardPower(power);
  if (standardPower === null) {
    return;
  }

  // --- Update own status ---
  const oldStatus = power.activation.activationStatus;
  const oldRanks = getActiveRanks(power);
  if (action === "on") {
    power.activation.activationStatus = "on";
  } else if (action === "off") {
    power.activation.activationStatus = "off";
  } else if (action === "partial") {
    const oldActivationStatus = power.activation.activationStatus;
    power.activation.activationStatus = "partial";
    power.activation.ranks = oldActivationStatus === 'on' && power.ranks !== null ? power.ranks : 0;
  } else if (action === "incr") {
    if (power.ranks !== null && power.activation.ranks < power.ranks) {
      power.activation.ranks +=  1;
    }
  } else if (action === "decr") {
    if (power.activation.ranks > 0) {
      power.activation.ranks -= 1;
    }
  } else {
    throw new Error(`Unsupported action '${action}' in setFeatureActivation().`);
  }
  const newStatus = power.activation.activationStatus;
  const newRanks = getActiveRanks(power);
  const statusChanged = oldStatus !== newStatus;
  const ranksChanged = oldRanks !== newRanks;

  // --- If nothing changed we are done ---
  if (!statusChanged && !ranksChanged) {
    return;
  }

  // --- Recurse on child powers ---
  if (["self", "parent", "sibling"].includes(comingFrom) && standardPower.powerLayout === "array") {
    const subpowerInheritedModifierLists = [power.extras, power.flaws, ...inheritedModifierLists];
    if (newStatus === "off") {
      // -- all subpowers off --
      for (const subpower of power.subpowers) {
        setFeatureActivation(charsheet, subpower, subpowerInheritedModifierLists, "off", "parent");
      }
    } else if (newStatus === "on") {
      if (power.effect === "Linked") {
        // -- all subpowers on --
        for (const subpower of power.subpowers) {
          setFeatureActivation(charsheet, subpower, subpowerInheritedModifierLists, "on", "parent");
        }
      } else { // power.effect must be "Alternate"
        // -- first subpower on; rest off --
        let isFirst = true;
        for (const subpower of power.subpowers) {
          setFeatureActivation(charsheet, subpower, subpowerInheritedModifierLists, isFirst ? "on" : "off", "parent");
          isFirst = false;
        }
      }
    } else if (newStatus === "partial") {
      throw new Error(`Array powers should never become partial, but this one was.`);
    }
  }

  // --- For cases where the power has a parent ---
  if (["self", "child"].includes(comingFrom)) {
    const parentArray = findContainingArrayByHsid(charsheet, power.hsid);
    if (parentArray !== null) {

      // --- Modify parent ---
      const parentStatus = parentArray.activation.activationStatus;
      if (statusChanged && ["on", "partial"].includes(newStatus) && parentStatus === "off") {
        const parentInheritedModifierLists = getInheritedModifierLists(charsheet, parentArray);
        setFeatureActivation(charsheet, parentArray, parentInheritedModifierLists, "on", "child");
      } else if (statusChanged && newStatus === "off" && parentArray.effect === "Linked" && parentStatus === "on") {
        const parentInheritedModifierLists = getInheritedModifierLists(charsheet, parentArray);
        setFeatureActivation(charsheet, parentArray, parentInheritedModifierLists, "off", "child");
      }

      // --- Modify siblings ---
      if (parentArray.effect === "Alternate") {
        // -- Alternate Arrays --
        if (statusChanged && ["on", "partial"].includes(newStatus)) {
          // - Turn off all other siblings -
          for (const siblingPower of parentArray.subpowers) {
            if (siblingPower !== power) {
              setFeatureActivation(charsheet, siblingPower, inheritedModifierLists, "off", "sibling");
            }
          }
        } else if (newStatus === "off") {
          // - Nothing needs to be done when turning a power off in an Alternate array -
        }
      } else if (parentArray.effect === "Linked") {
        // -- Linked Arrays --
        if (statusChanged && newStatus === "on") {
          // - Turn on all other siblings -
          for (const siblingPower of parentArray.subpowers) {
            if (siblingPower !== power) {
              setFeatureActivation(charsheet, siblingPower, inheritedModifierLists, "on", "sibling");
            }
          }
        } else if (statusChanged && newStatus === "off") {
          // - Turn off all other siblings -
          for (const siblingPower of parentArray.subpowers) {
            if (siblingPower !== power) {
              setFeatureActivation(charsheet, siblingPower, inheritedModifierLists, "off", "sibling");
            }
          }
        } else if (statusChanged && newStatus === "partial") {
          // - Any sibling that is off should be turned on -
          for (const siblingPower of parentArray.subpowers) {
            if (siblingPower !== power && siblingPower.activation.activationStatus === "off") {
              setFeatureActivation(charsheet, siblingPower, inheritedModifierLists, "on", "sibling");
            }
          }
        }
      } else if (parentArray.effect === "Dynamic") {
        // -- Dynamic Arrays --
        const hasIncreased = oldRanks < newRanks;
        if (hasIncreased) {
          // - It has increased; need to reduce other things to make space for it -
          const oldCost = (oldRanks === 0
            ? 0 // ranks of 0 costs zero even if there are flat modifiers
            : powerCostCalculate(power, inheritedModifierLists, oldRanks).cost
          );
          let costToDistribute = dynamicArrayOverspendAmount(parentArray, inheritedModifierLists);
          if (costToDistribute > 0) {
            const siblings = parentArray.subpowers.filter(x => x !== power);
            while (costToDistribute > 0) {
              if (siblings.length === 0) {
                throw new Error(`Tried to distribute cost in a dynamic array but all siblings were tapped out. Shouldn't be possible.`);
              }
              const sibling = siblings[siblings.length - 1];
              const standardSiblingPower = getStandardPower(sibling);
              const oldSiblingStatus = sibling.activation.activationStatus;
              const oldSiblingRanks = getActiveRanks(sibling);
              if (standardSiblingPower === null || oldSiblingRanks === 0) {
                siblings.splice(siblings.length - 1); // move past this sibling; it can't be reduced
                continue; // go back to the top of the while() loop
              }
              const oldSiblingCost = powerCostCalculate(sibling, inheritedModifierLists, oldSiblingRanks).cost;
              if (oldSiblingStatus === "partial") {
                setFeatureActivation(charsheet, sibling, inheritedModifierLists, "decr", "sibling");
              } else if (oldSiblingStatus === "on") {
                if (standardSiblingPower.canBePartial) {
                  setFeatureActivation(charsheet, sibling, inheritedModifierLists, "partial", "sibling");
                  setFeatureActivation(charsheet, sibling, inheritedModifierLists, "decr", "sibling");
                } else {
                  setFeatureActivation(charsheet, sibling, inheritedModifierLists, "off", "sibling");
                }
              }
              const newSiblingRanks = getActiveRanks(sibling);
              const newSiblingCost = powerCostCalculate(sibling, inheritedModifierLists, newSiblingRanks).cost;
              const costExpended = oldSiblingCost - newSiblingCost;
              costToDistribute -= costExpended;
            }
          }
        }
      }
    }

  }
}


/*
 * Passed a feature, this returns {isActive: <whether-it-is-active>, ranks: <currently-active-ranks>}.
 */
const activationState = function(feature) {
  const activationStatus = feature.activation.activationStatus;
  const activeRanks = feature.activation.ranks;
  const isActive = (activationStatus === "on" || activationStatus === "partial" && activeRanks > 0);
  const ranks = (
    activationStatus === "on"
      ? feature.ranks
      : activationStatus === "partial"
        ? activeRanks
        : 0 // activationStatus === "off"
  );
  return {isActive, ranks};
}


/*
 * Given a power, this returns the dictionary of class names used by PowerList.vue and Power.vue
 * to make it look different when on / partial / off.
 */
const powerStateClasses = function(power) {
  const status = power.activation.activationStatus;
  const ranks = getActiveRanks(power);
  return {
    partial: status === 'partial',
    off: getActiveRanks(power) === 0,
  };
}


/*
 * Common function which creates a new error message and sends it to the even queue
 * to be displayed.
 */
const showAlert = function({message, lifetime, format}) {
  if (!["short", "long", "manual"].includes(lifetime)) {
    lifetime = "short";
  }
  if (!["error", "info"].includes(format)) {
    format = "error";
  }
  const alertObject = {
    message: message,
    lifetime: lifetime,
    format: format,
    hsid: newHsid(),
  }
  Vue.prototype.$globals.eventBus.$emit("show-alert", alertObject);
}


export {
  capitalize,
  fieldAllowedRegEx,
  powerBaseCost,
  powerCostCalculate,
  getInheritedModifierLists,
  rangeToInt,
  intToRange,
  advantageIsRanked,
  costOfAbility,
  abilityCost,
  defenseCost,
  skillCost,
  advantageCost,
  equipmentCost,
  powerCost,
  totalCost,
  availablePoints,
  costOutOfSpec,
  skillRoll,
  findModifierItemTemplate,
  buildFeature,
  getStandardPower,
  getPowerOption,
  replacePower,
  setPowerEffect,
  setPowerOption,
  addPowerModifier,
  deletePowerModifier,
  modifierDisplaySign,
  modifierDisplayText,
  buildNewModifier,
  powerUpdaterEvents,
  createUpdatersForFeature,
  addActiveEffect,
  removeActiveEffects,
  findOrCreateActiveEffect,
  activeEffectModifier,
  isManuallyAdjusted,
  lacksStat,
  attackRollInfo,
  setFeatureActivation,
  activationState,
  powerStateClasses,
  showAlert,
};
