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
        <div class="attack-type">{{attack.effectType}}</div>
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
    grid-template-columns: max-content max-content max-content max-content;
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
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .attack-type {
    color: var(--under-development-color);
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
    padding: 2px 6px;
  }
</style>
