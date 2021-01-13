<template>
  <boxed-section title="Attacks">
    <template v-slot:exhibit>
      <local-cost-display/>
    </template>
    <div class="vertical">
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
            :show-active-attacks="showInactiveAttacks"
        />
        <div class="empty-notice" v-if="getCharsheet().attacks.attackList.length === 0">No Attacks</div>
      </div>
      <edit-button class="bottom-button" :on-click="() => showInactiveAttacks = !showInactiveAttacks" :is-navigation="true">{{showInactiveAttacks ? 'Hide Inactive' : 'Show All'}}</edit-button>
    </div>
  </boxed-section>
</template>

<script>
import LocalCostDisplay from "@/components/LocalCostDisplay.vue";
import AttacksEntry from "@/components/AttacksEntry.vue";

export default {
    name: "Attacks",
    components: {
      LocalCostDisplay,
      AttacksEntry,
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        showInactiveAttacks: false,
      };
    }
  }
</script>

<style scoped>
  .attack-list {
    display: inline grid;
    grid-template-columns: max-content max-content max-content max-content max-content;
    justify-items: stretch;
  }
  .vertical {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .boxed-section > .vertical {
    background-color: var(--section-color);
  }
  .attack-list {
    background-color: var(--paper-color);
  }
  .bottom-button {
    margin-left: 0;
    margin-top: 5px;
  }
</style>
