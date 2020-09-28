<!--
  This widget allows editing some special conditions that invalidate normal stat values like
  being a construct or lacking certain abilities.
-->
<template>
  <CollapsingSection class="stats-extras" title="Ability Extras" :columns="2">
      <label class="row-label" for="is-mindless-construct">Mindless Construct</label>
      <div class="grid-with-lines-cell">
        <edit-checkbox id="is-mindless-construct" :value="charsheet.misc.isMindlessConstruct" @input="toggleIsConstruct('isMindlessConstruct')"/>
      </div>
      <label class="row-label" for="is-immobile-construct">Immobile Construct</label>
      <div class="grid-with-lines-cell">
        <edit-checkbox id="is-immobile-construct" :value="charsheet.misc.isImmobileConstruct" @input="toggleIsConstruct('isImmobileConstruct')"/>
      </div>
      <div class="display-contents"
           v-for="(statData, statName) in statsData"
           :key="statName"
      >
        <label class="row-label grid-with-lines-cell" :for="`lacks-{statName}`">Lacks {{statName}}</label>
        <div class="grid-with-lines-cell">
          <edit-checkbox :id="`lacks-${statName}`" :value="lacksStat(charsheet, statName)" @input="toggleLacksStat(statName)"/>
        </div>
      </div>
  </CollapsingSection>
</template>

<script>
  import {lacksStat} from "../js/heroSheetUtil.js";
  const statsData = require("../data/statsData.json");

  export default {
    name: "StatsExtras",
    inject: ["getCharsheet"],
    data: function() {
      return {
        statsData,
        lacksStat,
        charsheet: this.getCharsheet(),
      }
    },
    methods: {
      toggleLacksStat: function(statName) {
        const statObj = this.charsheet.abilities[statName];
        const lacksStat = this.lacksStat(this.charsheet, statName);
        if (lacksStat) {
          statObj.entered = 0;
        } else {
          statObj.entered = "lack";
        }
      },
      toggleIsConstruct: function(fieldName) {
        this.charsheet.misc[fieldName] = !this.charsheet.misc[fieldName];
        const affectedStats = {
          isImmobileConstruct: ["stamina", "strength", "agility"],
          isMindlessConstruct: ["stamina", "intellect", "presence"],
        }[fieldName];
        if (this.charsheet.misc[fieldName]) {
          // Becoming a construct
          for (const affectedStat of affectedStats) {
            this.charsheet.abilities[affectedStat].entered = "construct";
          }
        } else {
          // Ceasing to be a construct
          for (const affectedStat of affectedStats) {
            const affectedStatData = this.charsheet.abilities[affectedStat];
            if (affectedStatData.entered === "construct") {
              affectedStatData.entered = 0;
              // Special case for stamina when both constructs were on
              if (affectedStat === "stamina") {
                const otherFieldName = {
                  isImmobileConstruct: "isMindlessConstruct",
                  isMindlessConstruct: "isImmobileConstruct",
                }[fieldName];
                if (this.charsheet.misc[otherFieldName]) {
                  affectedStatData.entered = "construct";
                }
              }
            }
          }
        }
      },
    }
  }
</script>

<style scoped>
  .stats-extras {
    margin-top: 10px;
    display: inline grid;
    background-color: var(--paper-color);
  }
</style>
