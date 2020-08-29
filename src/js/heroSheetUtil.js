import Vue from 'vue'
import {newBlankPower} from "./heroSheetVersioning.js";

const standardAdvantages = require("../data/standardAdvantages.json");
const standardPowers = require("../data/standardPowers.json");
const modifiersData = require("../data/modifiersData.json");
const skillsData = require("../data/skillsData.json");


function isArray(power) {
  if (power.effect === "") { // dummy used for new powers that don't have an effect set yet
    return false;
  }
  const standardPower = standardPowers[power.effect];
  if (!standardPower) {
    throw Error(`Power effect '${power.effect}' is not a standard power.`);
  }
  return standardPower.isArray;
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
 * This contains the formulas to calculate the cost of a (non-array) power.
 *
 * As input, it takes a list of modifier lists (sometimes the modifiers come
 * from different places, like when an array is calculating the costs of the
 * by recalculating the child costs with modifiers attached) along with a base
 * cost and ranks. As output it returns an object -- one field is the cost, but
 * there are other fields for intermediate values that we might want to display.
 */
const powerCostCalculate = function(power, extraModifierLists=[]) {

  // --- Calculate multipliers & adders from modifiers ---
  let extrasMultiplier = 0;
  let flawsMultiplier = 0;
  let normalFlatAdder = 0;
  let flatPer5FinalPoints = 0;
  const modifierLists = [power.extras, power.flaws, ...extraModifierLists];
  for (const modifierList of modifierLists) {
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
      } else if (modifier.costType === "flatPoints") {
        normalFlatAdder += modifier.cost;
      } else if (modifier.costType === "flatPointsPerRankOfModifier") {
        normalFlatAdder += modifier.cost * modifier.ranks;
      } else if (modifier.costType === "flatPointsPer5PointsOfFinalCost") {
        flatPer5FinalPoints += modifier.cost;
      } else {
        throw Error(`Unsupported modifier costType of '${modifier.costType}'.`);
      }
    }
  }

  // --- Calculate the cost ---
  let cost;
  let flatAdder;
  if (isArray(power)) {
    const subpowers = power.subpowers;
    const numberOfSubpowers = subpowers.length;
    if (numberOfSubpowers === 0) {
      cost = 0;
      flatAdder = 0;
    } else {
      const subpowerCosts = subpowers.map(x => powerCostCalculate(x, modifierLists).cost);
      const largestSubpowerCost = Math.max(...subpowerCosts);
      if (power.effect === "Linked") {
        cost = subpowerCosts.reduce((x,y) => x + y, 0);
      } else if (power.effect === "Alternate") {
        cost = largestSubpowerCost + (numberOfSubpowers - 1);
      } else if (power.effect === "Dynamic") {
        cost = largestSubpowerCost + 2 *(numberOfSubpowers - 1) + 1;
      } else {
        throw Error(`Unsupported array power of '${power.name}'.`)
      }
      flatAdder = normalFlatAdder; // no easy way to display values from a per-5-pts on the array
    }
  } else {
    const modifiedCostPerRank = power.baseCost + extrasMultiplier + flawsMultiplier;
    const costBeforeFlats = modifiedCostPerRank >= 1
      ? modifiedCostPerRank * power.ranks
      : Math.ceil( power.ranks / (2 - modifiedCostPerRank) );
    const costWithNormalAdder = Math.max(1, costBeforeFlats + normalFlatAdder);
    const finalAdjustment = Math.round((costWithNormalAdder / 5) * flatPer5FinalPoints);
    cost = Math.max(1, costBeforeFlats + normalFlatAdder + finalAdjustment);
    flatAdder = cost - costBeforeFlats;
  }

  // --- Return result object ---
  return {
    extrasMultiplier,
    flawsMultiplier,
    flatAdder,
    cost
  };
};


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
  const characterPoints = charsheet.equipment.reduce((x,y) => x + y.cost, 0);
  return Math.ceil(characterPoints / 5);
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
          throw Error(`Standard modifier '${modifierName}' has no option named '${optionName}'.`);
        } else {
          throw Error(`Standard modifier '${modifierName}' has multiple options named '${optionName}'.`);
        }
      } else {
        throw Error(`Standard modifier '${modifierName}' has no options.`);
      }
    } else {
      return modifier;
    }
  } else if (possibleModifiers.length === 0) {
    throw Error(`No standard modifier named '${modifierName}'.`);
  } else {
    throw Error(`Multiple standard modifiers named '${modifierName}'.`);
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
      throw Error(`Must specify an effect with a modifierSource of '${modifierSource}'.`);
    }
  } else {
    throw Error(`Unsupported modifierSource of '${modifierSource}'.`);
  }
}

/*
 * This is passed a template for a Feature and it creates a new
 * feature. A Feature is basically a power, but it might be
 * attached to something different like a piece of equipment.
 */
const buildFeature = function(template) {
  const feature = newBlankPower();
  feature.name = template.name || template.effect;
  feature.description = template.description || "";
  feature.ranks = template.ranks || 1;
  setPowerEffect(feature, template.effect);
  if (template.option) {
    setPowerOption(feature, template.option);
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
      addPowerModifier(feature, modifierType, modifier)
    }
  }
  if (template.subpowers) {
    for (const subpowerTemplate of template.subpowers) {
      const subpower = buildFeature(subpowerTemplate);
      feature.subpowers.push(subpower);
    }
  }
  recalculatePowerCost(feature);
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
    return standardPower.powerOptions[power.option];
  } else {
    return null;
  }
};

/*
 * Given a power object from the charsheet, this re-calculates the baseCost
 * field and the cost field.
 */
const recalculatePowerBaseCost = function(power) {
  const standardPower = getStandardPower(power);
  if (standardPower === null) {
    power.baseCost = NaN; // invalid
  } else  if (standardPower.isArray) {
    power.baseCost = null; // meaningless
  } else if (standardPower.powerOptions) {
    const powerOption = getPowerOption(power);
    if (powerOption === null) {
      power.baseCost = NaN; // invalid
    } else {
      power.baseCost = powerOption.baseCost;
    }
  } else {
    power.baseCost = standardPower.baseCost;
  }
};

/*
 * Given a Power object from the charsheet, this re-calculates the cost
 * field.
 */
const recalculatePowerCost = function(power) {
  power.cost = powerCostCalculate(power).cost;
};

/*
 * Given a Power object from the charsheet and a feature, this copies
 * the feature over into the power and replaces whatever it used to
 * contain with the fields of the feature.
 *
 * FIXME: Need to confirm that this handles subpowers correctly
 */
const replacePower = function(power, feature) {
  for (const [fieldName, fieldValue] of Object.entries(feature)) {
    Vue.set(power, fieldName, fieldValue);
  }
  recalculatePowerBaseCost(power);
  recalculatePowerCost(power);
}


/*
 * Given a Power object from the charsheet and a new effect string, this
 * alters the effect and then re-calculates all the fields of the Power
 * object that depend on the effect.
 */
const setPowerEffect = function(power, effect) {
  power.effect = effect;
  const standardPower = getStandardPower(power);
  if (standardPower === null) {
    power.effectDescription = "";
    power.baseCost = NaN; // Default to a cost of NaN when the power is unknown
  } else {
    power.effectDescription = standardPower.description;
    if (standardPower.powerOptions) {
      // FIXME: Consider switching to prefill with "Select One" rather than the first option
      if (!power.option || !(power.option in standardPower.powerOptions)) {
        // Current option is invalid, so re-assign to the first option
        let nameOfFirstPower = null;
        for (let powerName in standardPower.powerOptions) {
          nameOfFirstPower = powerName;
          break;
        }
        power.option = nameOfFirstPower;
      }
    } else {
      power.option = null;
    }
    if (!standardPower.isArray) {
      power.subpowers = [];
    }
    recalculatePowerBaseCost(power);
  }
  recalculatePowerCost(power);
}

/*
 * Given a Power object from the charsheet and a new option string, this
 * alters the effect and then re-calculates all the fields of the Power
 * object that depend on the effect.
 */
const setPowerOption = function(power, option) {
  power.option = option;
  recalculatePowerBaseCost(power);
  recalculatePowerCost(power);
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
const addPowerModifier = function(power, modifierType, modifier) {
  power[modifierType].push(modifier);
  power.cost = powerCostCalculate(power).cost
}

/*
 * Delete a modifier from a particular power.
 */
const deletePowerModifier = function(power, modifierType, modifier) {
  const modifierList = power[modifierType];
  const index = modifierList.indexOf(modifier);
  if (index !== -1) {
    modifierList.splice(index, 1);
    power.cost = powerCostCalculate(power).cost;
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

const POWER_TO_UPDATER_MAP = {
  "Damage": "PowerAttackUpdater",
  "Affliction": "PowerAttackUpdater",
  "Nullify": "PowerAttackUpdater",
  "Weaken": "PowerAttackUpdater",
  "Enhanced Trait": "EnhancedTraitUpdater",
  "Protection": "ProtectionUpdater",
};

/*
 * Given a power (or feature), this returns the event payload needed to create
 * a new updater for that power, or returns null if this power does not require
 * any updater.
 */
const powerUpdaterEvent = function(charsheet, power) {
  const updater = POWER_TO_UPDATER_MAP[power.effect];
  if (updater === undefined) {
    return null;
  }
  return {
    charsheet,
    updater,
    power,
  };
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
    throw Error(`Multiple active effects that matched.`);
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
    throw Error(`The entered ranks for ${statName} are '${entered}' which is an unexpected type.`);
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
  const ranksSource = isStrengthBased ? "Ranks" : "Ranks + Strength";
  if (!hasAttackRoll) {
    return { isAttack, isAllowed, ranks, ranksSource, hasAttackRoll, isPerception, isArea };
  }
  const keyStatValue = charsheet.abilities[keyStat].ranks;
  const attackRoll = nullReset(keyStatValue) + nullReset(attack.attackCheckAdjustment);
  const hasAdjustment = attack.attackCheckAdjustment !== 0;
  const attackRollSource = hasAdjustment ? keyStatDisplay : `${keyStatDisplay} + Skill`;
  return { isAttack, isAllowed, ranks, ranksSource, hasAttackRoll, attackRoll, attackRollSource };
}


export {
  powerCostCalculate,
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
  recalculatePowerBaseCost,
  replacePower,
  setPowerEffect,
  setPowerOption,
  addPowerModifier,
  deletePowerModifier,
  modifierDisplaySign,
  modifierDisplayText,
  buildNewModifier,
  powerUpdaterEvent,
  addActiveEffect,
  removeActiveEffects,
  findOrCreateActiveEffect,
  activeEffectModifier,
  isManuallyAdjusted,
  lacksStat,
  attackRollInfo,
};
