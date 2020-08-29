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
      <attacks-entry
          v-for="(attack, index) in getCharsheet().attacks.attackList"
          :key="index"
          :attack="attack"
      />
      <div class="empty-notice" v-if="getCharsheet().attacks.attackList.length === 0">No Attacks</div>
    </div>
  </boxed-section>
</template>

<script>
import LocalCostDisplay from "./LocalCostDisplay.vue";

import AttacksEntry from "./AttacksEntry.vue";

export default {
    name: "Attacks",
    components: {
      LocalCostDisplay,
      AttacksEntry,
    },
    inject: ["getCharsheet"],
  }
</script>

<style scoped>
  .attack-list {
    display: inline grid;
    grid-template-columns: max-content max-content max-content max-content max-content;
    justify-items: stretch;
  }
</style>
