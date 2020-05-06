import {newBlankPower} from "./heroSheetVersioning.js";

const standardAdvantages = require("../data/standardAdvantages.json");
const standardPowers = require("../data/standardPowers.json");


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
 * This contains the formulas to calculate the cost of a (non-array) power.
 *
 * As input, it takes a list of modifier lists (sometimes the modifiers come
 * from different places, like with an array) along with a base cost and
 * ranks. As output it returns an object -- one field is the cost, but there
 * are other fields for intermediate values that we might want to display.
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


const abilityCost = function(charsheet) {
  return Object.values(charsheet.abilities).reduce((x,y) => x + y.cost, 0);
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
  return charsheet.equipment.reduce((x,y) => x + y.cost, 0);
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
 * This is passed a template for a Feature and it creates a new
 * feature. A Feature is basically a power, but it might be
 * attached to something different like a piece of equipment.
 */
const buildFeature = function(template) {
  const feature = newBlankPower();
  feature.name = template.name;
  feature.description = template.description;
  setPowerEffect(feature, template.effect);
  // FIXME: Need to handle extras and flaws.
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


export {
  powerCostCalculate,
  advantageIsRanked,
  abilityCost,
  defenseCost,
  skillCost,
  advantageCost,
  equipmentCost,
  powerCost,
  totalCost,
  availablePoints,
  costOutOfSpec,
  buildFeature,
  getStandardPower,
  getPowerOption,
  recalculatePowerBaseCost,
  setPowerEffect,
  setPowerOption,
};
