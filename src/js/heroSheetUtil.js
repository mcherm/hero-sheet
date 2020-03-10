
const standardAdvantages = require("../data/standardAdvantages.json");
const standardPowers = require("../data/standardPowers.json");


function isArray(power) {
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


const abilityCost = function(character) {
  return Object.values(character.abilities).reduce((x,y) => x + y.cost, 0);
};

const defenseCost = function(character) {
  return Object.values(character.defenses).reduce((x,y) => x + y.cost, 0);
};

const skillCost = function(character) {
  return character.skills.cost
};

const advantageCost = function(character) {
  console.log(`advantageCost() <- character=${character} character.version=${JSON.stringify(Object.keys(character))}`); // FIXME: Remove
  return character.advantages.reduce((x,y) => x + (advantageIsRanked(y) ? y.ranks : 1), 0);
};

const powerCost = function(character) {
  return Object.values(character.powers).reduce((x,y) => x + y.cost, 0);
};

const totalCost = function(character) {
  return abilityCost(character) + defenseCost(character) + skillCost(character) +
    advantageCost(character) + powerCost(character);
};

const availablePoints = function(character) {
  return character.campaign.powerLevel * 15 + character.campaign.xpAwarded;
};

const costOutOfSpec = function(character) {
  return totalCost(character) > availablePoints(character);
};


export {
  powerCostCalculate,
  advantageIsRanked,
  abilityCost,
  defenseCost,
  skillCost,
  advantageCost,
  powerCost,
  totalCost,
  availablePoints,
  costOutOfSpec
};
