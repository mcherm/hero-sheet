<template>
  <boxed-section title="Attacks">
    <template v-slot:exhibit>
      <local-cost-display/>
    </template>
    <div class="attack-list grid-with-lines">
      <div class="col-label">Attack</div>
      <div class="col-label">Effect</div>
      <div class="col-label not-capitalized">If attacker succeeds at...</div>
      <div class="col-label not-capitalized">...then defender resists with...</div>
      <div class="col-label not-capitalized">...resulting in</div>
      <div
          v-for="(attack, index) in getCharsheet().attacks.attackList"
          :key="index"
          class="display-contents"
      >
        <div class="attack-name">{{attack.name}}</div>

        <div v-if="typeof(attack.attackCheck) === 'string'" class="inapplicable">N/A</div>

        <div class="attack-type">{{attack.range}} {{attack.scope === "area" ? "area" : ""}} rank-{{attack.ranks}} {{attack.effectType}}</div>

        <div class="attack-check">
          <div v-if="attack.range === 'personal'">This is not an attack</div>
          <div v-else-if="attack.range === 'perception'">Perceiving the target</div>
          <div v-else-if="attack.scope === 'area'">
            <div>If in the area take half effect by succeeding at:</div>
            <div>D20 + Dodge <span class="vs">vs.</span> 10 + <span class="sourced-value" title="Attack Ranks">{{attack.ranks}}</span></div>
          </div>
          <div v-else-if="attackRollInfo(attack).attackIsDisallowed" class="inapplicable">N/A</div>
          <div v-else>
            D20 +
            <span v-if="!attackRollInfo(attack).attackIsValid" class="sourced-value error" :title="attackRollInfo(attack).sourceDescription">
              Err
            </span>
            <span v-else class="sourced-value" :title="attackRollInfo(attack).sourceDescription">
              {{attackRollInfo(attack).attackRoll}}
            </span>
            <span class="vs"> vs. </span>
            <span>{{attack.range === 'close' ? 'Parry' : 'Dodge'}}</span>
            + 10
          </div>
        </div>

        <div class="resistance-dc">
          <div v-if="attack.range === 'perception' || attackRollInfo(attack).attackIsDisallowed" class="inapplicable">N/A</div>
          <div v-else-if="attack.effectType === 'damage'">
            D20 + Toughness - Resistance Penalty
            <span class="vs">vs. </span>
            <span v-if="isNaN(attack.ranks)" class="sourced-value error" title="Ranks">
              Err
            </span>
            <span v-else class="sourced-value" title="Ranks">{{attack.ranks}}</span>
            + 15
          </div>
          <div v-else-if="attack.effectType === 'affliction'" class="under-development">TBD: UNKNOWN</div> <!--FIXME: Real code needed-->
          <div v-else-if="attack.effectType === 'nullify'">
            D20 + <span class="sourced-value" title="Ranks">{{attack.ranks}}</span>
            <span class="vs"> vs.</span>
            (Targeted Rank or Will) + D20
          </div>
          <div v-else-if="attack.effectType === 'weaken'">
            D20 + (Fortitude or Will)
            <span class="vs">vs. </span>
            <span class="sourced-value" title="Ranks">{{attack.ranks}}</span>
            + 10
          </div>
          <div v-else class="error">ERROR</div>
        </div>

        <div class="outcome">
          Some Outcome
        </div>

      </div>
      <div class="empty-notice" v-if="getCharsheet().attacks.attackList.length === 0">No Attacks</div>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";
  import {lacksStat} from "../js/heroSheetUtil";

  export default {
    name: "Attacks",
    components: {
      LocalCostDisplay
    },
    inject: ["getCharsheet"],
    methods: {
      isOutOfSpec: function(attack) {
        const activeViolation = key => {
          const violation = this.getCharsheet().constraintViolations[key];
          return violation !== undefined && !violation.gmApproval;
        };
        return activeViolation(`AttackRoll@${attack.hsid}`);
      },
      /*
       * This is given a (close or ranged) singleTarget attack and returns an object with a few values:
       *   attackIsDisallowed: a boolean telling whether the attack is simply not permitted
       *   sourceDescription if !attackIsDisallowed, a string describing how the roll is computed
       *   attackIsValid: if !attackIsDisallowed, a boolean telling whether the value of the roll be computed
       *   attackRollIsError: if attackIsValid, a boolean telling whether the attackRoll is NaN instead of a number
       *   attackRoll: if !attackRollIsError, a number which is the bonus to the roll
       */
      attackRollInfo: function(attack) {
        if (!["close", "ranged"].includes(attack.range)) {
          throw new Error(`Method allowed only for a close or ranged attack. Was "${attack.range}".`);
        }
        if (!["singleTarget"].includes(attack.scope)) {
          throw new Error(`Method allowed only for singleTarget attacks. Was "${attack.scope}".`);
        }
        const [keyStat, keyStatDisplay] = attack.range === 'close' ? ['fighting', 'Fighting'] : ['dexterity', 'Dexterity'];
        const lacksKeyStat = lacksStat(this.getCharsheet(), keyStat);
        const attackIsDisallowed = lacksKeyStat;
        if (attackIsDisallowed) {
          return { attackIsDisallowed };
        }
        const hasAdjustment = attack.attackCheckAdjustment !== 0;
        const sourceDescription = keyStatDisplay + (hasAdjustment ? " + Skill" : "");
        const keyStatValue = this.getCharsheet().abilities[keyStat].ranks;
        const attackIsValid = typeof(keyStatValue) === "number" && ! isNaN(keyStatValue);
        if (!attackIsValid ) {
          return { attackIsDisallowed, attackIsValid, sourceDescription };
        }
        const attackRoll = keyStatValue + attack.attackCheckAdjustment;
        return { attackIsDisallowed, attackIsValid, sourceDescription, attackRoll };
      }
    }
  }
</script>

<style scoped>
  .attack-list {
    display: inline grid;
    grid-template-columns: max-content max-content max-content max-content max-content;
    justify-items: stretch;
  }
  .attack-list .attack-name {
    padding: 2px 6px;
  }
  .attack-list .attack-check {
    padding: 2px 6px;
  }
  .attack-list .resistance-dc {
    padding: 2px 6px;
  }
  .attack-list .outcome {
    color: var(--under-development-color);
    padding: 2px 6px;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .attack-type {
    color: var(--under-development-color);
    padding: 2px 6px;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
    padding: 2px 6px;
  }
  .sourced-value {
    font-weight: bold;
    cursor: pointer;
  }
  .col-label.not-capitalized {
    text-transform: none;
  }
  .vs {
    font-style: italic;
  }
  .under-development {
    color: var(--under-development-color);
  }
  .sourced-value.error {
    background-color: var(--error-color);
    padding: 1px;
  }
</style>
