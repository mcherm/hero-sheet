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

        <div class="attack-check" :class="{'is-out-of-spec': isOutOfSpec(attack)}">
          <div v-if="!attackRollInfo(attack).isAttack" class="inapplicable">Affects self only</div>
          <div v-else-if="!attackRollInfo(attack).isAllowed" class="inapplicable">N/A</div>
          <div v-else-if="attackRollInfo(attack).isPerception">Perceiving the target</div>
          <div v-else-if="attackRollInfo(attack).isArea">
            <div>Defenders in the area attempt</div>
            <div>D20 + Dodge <span class="vs">vs.</span> 10 + <span class="sourced-value" title="Attack Ranks">{{attack.ranks}}</span></div>
            <div>for half-strength effect.</div>
          </div>
          <div v-else>
            D20 +
            <number-display class="sourced-value" :value="attackRollInfo(attack).attackRoll" :title="attackRollInfo(attack).attackRollSource"/>
            <span class="vs"> vs. </span>
            <span>{{attack.range === 'close' ? 'Parry' : 'Dodge'}}</span>
            + 10
          </div>
        </div>

        <div class="resistance-dc" :class="{'is-out-of-spec': isOutOfSpec(attack)}">
          <div v-if="!attackRollInfo(attack).isAttack" class="inapplicable">Not Resisted</div>
          <div v-else-if="!attackRollInfo(attack).isAllowed" class="inapplicable">N/A</div>
          <div v-else-if="attack.effectType === 'damage'">
            D20 + Toughness - Damage Penalty
            <span class="vs">vs.</span>
            15 +
            <number-display class="sourced-value" :value="attackRollInfo(attack).ranks" :title="attackRollInfo(attack).ranksSource"/>
          </div>
          <div v-else-if="attack.effectType === 'affliction'">
            D20 + (Fortitude or Will)
            <span class="vs">vs. </span>
            <number-display class="sourced-value" :value="attackRollInfo(attack).ranks" :title="attackRollInfo(attack).ranksSource"/>
            + 10
          </div>
          <div v-else-if="attack.effectType === 'nullify'">
            D20 +
            <number-display class="sourced-value" :value="attackRollInfo(attack).ranks" :title="attackRollInfo(attack).ranksSource"/>
            <span class="vs"> vs.</span>
            D20 + (Targeted Rank or Will)
          </div>
          <div v-else-if="attack.effectType === 'weaken'">
            D20 + (Fortitude or Will)
            <span class="vs">vs. </span>
            <number-display class="sourced-value" :value="attackRollInfo(attack).ranks" :title="attackRollInfo(attack).ranksSource"/>
            + 10
          </div>
          <div v-else class="error">ERROR</div>
        </div>

        <attacks-result-damage v-if="attack.effectType === 'damage'"/>
        <attacks-result-affliction v-else-if="attack.effectType === 'affliction'"/>
        <attacks-result-nullify v-else-if="attack.effectType === 'nullify'"/>
        <attacks-result-weaken v-else-if="attack.effectType === 'weaken'" :attack="attack"/>
        <div v-else class="error">ERROR</div>

      </div>
      <div class="empty-notice" v-if="getCharsheet().attacks.attackList.length === 0">No Attacks</div>
    </div>
  </boxed-section>
</template>

<script>
import LocalCostDisplay from "./LocalCostDisplay.vue";
import {lacksStat, attackRollInfo} from "../js/heroSheetUtil";

import AttacksResultDamage from "./AttacksResultDamage.vue"
import AttacksResultAffliction from "./AttacksResultAffliction.vue"
import AttacksResultNullify from "./AttacksResultNullify.vue"
import AttacksResultWeaken from "./AttacksResultWeaken.vue"

export default {
    name: "Attacks",
    components: {
      LocalCostDisplay,
      AttacksResultDamage,
      AttacksResultAffliction,
      AttacksResultNullify,
      AttacksResultWeaken,
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
      attackRollInfo: function(attack) {
        return attackRollInfo(this.getCharsheet(), attack);
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
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .attack-type {
    text-transform: capitalize;
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
  .sourced-value.number-display {
    display: inline;
    padding: 2px 1px;
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
  .is-out-of-spec {
    outline: var(--error-color) solid 4px;
    outline-offset: -4px;
  }
</style>
