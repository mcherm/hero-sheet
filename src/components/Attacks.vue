<template>
  <boxed-section title="Attacks">
    <template v-slot:exhibit>
      <local-cost-display/>
    </template>
    <div class="attack-list grid-with-lines">
      <div class="col-label">Attack</div>
      <div class="col-label">To Hit</div>
      <div class="col-label">Resist DC</div>
      <div class="col-label">Effect</div>
      <div class="col-label">If attacker succeeds at</div>
      <div
          v-for="(attack, index) in getCharsheet().attacks.attackList"
          :key="index"
          class="display-contents"
      >
        <div class="attack-name">{{attack.name}}</div>
        <div v-if="typeof(attack.attackCheck) === 'string'" class="inapplicable">N/A</div>
        <number-display
            v-else
            class="to-hit"
            :value="attack.attackCheck"
            :isOutOfSpec="isOutOfSpec(attack)"
        />
        <number-display
            v-if="attack.resistanceDC !== null"
            class="resistance-dc"
            :value="attack.resistanceDC"
            :isOutOfSpec="isOutOfSpec(attack)"
        />
        <div v-else class="inapplicable"></div>
        <div class="attack-type">{{attack.range}} {{attack.scope === "area" ? "area" : ""}} {{attack.effectType}}</div>
        <div class="attack-check">
          <div v-if="attack.range === 'personal'">This is not an attack</div>
          <div v-else-if="attack.range === 'perception'">Perceiving the target</div>
          <div v-else-if="attack.scope === 'area'">
            <div>If in the area take half effect by succeeding at:</div>
            <div>D20 + Dodge vs. 10 + <span class="sourced-value">{{attack.resistanceDC}}</span></div>
          </div>
          <div v-else>
            D20 + <span class="sourced-value" title="Attack Check">{{attack.attackCheck}}</span> vs.
            <span>{{attack.range === 'close' ? 'Parry' : 'Dodge'}}</span> + 10
          </div>
        </div>
      </div>
      <div class="empty-notice" v-if="getCharsheet().attacks.attackList.length === 0">No Attacks</div>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";

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
  .attack-list .to-hit {
    margin-left: 0;
  }
  .attack-list .resistance-dc {
    margin-left: 0;
  }
  .attack-list .attack-check {
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
</style>
