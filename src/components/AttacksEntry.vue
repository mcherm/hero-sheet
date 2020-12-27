<!--
  A sub-component of the Attacks component, this renders a single row containing a single
  attack.
-->
<template>
  <div class="display-contents" v-show="attack.isActive">
    <div class="attack-name">{{attack.name}}</div>

    <div v-if="typeof(attack.attackCheck) === 'string'" class="inapplicable">N/A</div>

    <div class="attack-type">{{attack.range}} {{attack.scope === "area" ? "area" : ""}}  {{attack.isStrengthBased ? "strength and" : ""}} rank-{{attack.ranks}} {{attack.effectType}}</div>

    <div class="attack-check" :class="{'is-out-of-spec': isOutOfSpec}">
      <div v-if="!info.isAttack" class="inapplicable">Affects self only</div>
      <div v-else-if="!info.isAllowed" class="inapplicable">N/A</div>
      <div v-else-if="info.isPerception">Perceiving the target</div>
      <div v-else-if="info.isArea">
        <div>Defenders in the area attempt</div>
        <div>D20 + Dodge <span class="vs">vs.</span> 10 + <span class="sourced-value" title="Attack Ranks">{{attack.ranks}}</span></div>
        <div>for half-strength effect.</div>
      </div>
      <div v-else>
        D20 +
        <number-display class="sourced-value" :value="info.attackRoll" :title="info.attackRollSource"/>
        <span class="vs"> vs. </span>
        <span>{{attack.range === 'close' ? 'Parry' : 'Dodge'}}</span>
        + 10
      </div>
    </div>

    <div class="resistance-dc" :class="{'is-out-of-spec': isOutOfSpec}">
      <div v-if="!info.isAttack" class="inapplicable">Not Resisted</div>
      <div v-else-if="!info.isAllowed" class="inapplicable">N/A</div>
      <div v-else-if="attack.effectType === 'damage'">
        D20 + Toughness - Damage Penalty
        <span class="vs">vs.</span>
        15 +
        <number-display class="sourced-value" :value="info.ranks" :title="info.ranksSource"/>
      </div>
      <div v-else-if="attack.effectType === 'affliction'">
        D20 + (Fortitude or Will)
        <span class="vs">vs. </span>
        <number-display class="sourced-value" :value="info.ranks" :title="info.ranksSource"/>
        + 10
      </div>
      <div v-else-if="attack.effectType === 'nullify'">
        D20 +
        <number-display class="sourced-value" :value="info.ranks" :title="info.ranksSource"/>
        <span class="vs"> vs.</span>
        D20 + (Targeted Rank or Will)
      </div>
      <div v-else-if="attack.effectType === 'weaken'">
        D20 + (Fortitude or Will)
        <span class="vs">vs. </span>
        <number-display class="sourced-value" :value="info.ranks" :title="info.ranksSource"/>
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
</template>

<script>
import {attackRollInfo} from "../js/heroSheetUtil.js";

import AttacksResultDamage from "./AttacksResultDamage.vue"
import AttacksResultAffliction from "./AttacksResultAffliction.vue"
import AttacksResultNullify from "./AttacksResultNullify.vue"
import AttacksResultWeaken from "./AttacksResultWeaken.vue"

export default {
  name: "AttacksEntry",
  components: {
    AttacksResultDamage,
    AttacksResultAffliction,
    AttacksResultNullify,
    AttacksResultWeaken,
  },
  inject: ["getCharsheet"],
  props: {
    attack: { type: Object, required: true }
  },
  computed: {
    info: function() {
      return attackRollInfo(this.getCharsheet(), this.attack);
    },
    isOutOfSpec: function() {
      const violation = this.getCharsheet().constraintViolations[`AttackRoll@${this.attack.hsid}`];
      return violation !== undefined && !violation.gmApproval;
    }
  }
}
</script>

<style scoped>
.attack-name {
  padding: 2px 6px;
}
.attack-check {
  padding: 2px 6px;
}
.resistance-dc {
  padding: 2px 6px;
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
.vs {
  font-style: italic;
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
