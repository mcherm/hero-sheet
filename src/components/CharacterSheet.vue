<!--
  Responsible for the actual display of a charsheet -- either of the main character OR
  of some ally.
-->
<template>
  <div class="character-sheet v-box">
    <tab-display v-if="charsheet !== null">
      <template slot="background">
        <div class="h-box">
          <campaign :campaign="charsheet.campaign"/>
          <background/>
          <overall-costs/>
        </div>
      </template>
      <template slot="abilities">
        <div class="h-box">
          <basic-stats/>
          <defenses/>
          <overall-costs/>
        </div>
      </template>
      <template slot="skills">
        <skills/>
      </template>
      <template slot="advantages">
        <advantages v-on:show-ally="allyShown = $event"/>
      </template>
      <template slot="equipment">
        <equipment/>
      </template>
      <template slot="powers">
        <power-list-top-level/>
      </template>
      <template slot="complications">
        <complications/>
      </template>
      <template slot="attacks">
        <attacks/>
      </template>
      <template slot="adjustments">
        <div class="v-box">
          <adjustments/>
          <constraint-violations/>
        </div>
      </template>
      <template slot="conditions">
        <conditions/>
      </template>
    </tab-display>
    <modal-lightbox v-if="allyShown" v-on:exit="allyShown = null">
      <div class="title">{{findAllyByHsid(charsheet, allyShown).type}}</div>
      <character-sheet
        :charsheet="findAllyByHsid(charsheet, allyShown).charsheet"
        :is-ally="true"
      />
    </modal-lightbox>
  </div>
</template>

<script>
  import TabDisplay from "./TabDisplay.vue";
  import Campaign from "./Campaign.vue"
  import Background from "./Background.vue"
  import BasicStats from "./BasicStats.vue"
  import Defenses from "./Defenses.vue"
  import Skills from "./Skills.vue"
  import Advantages from "./Advantages.vue"
  import Equipment from "./Equipment.vue";
  import OverallCosts from "./OverallCosts.vue"
  import PowerListTopLevel from "./PowerListTopLevel.vue"
  import Complications from "./Complications.vue";
  import Attacks from "./Attacks.vue"
  import Adjustments from "./Adjustments.vue";
  import ConstraintViolations from "./ConstraintViolations.vue";
  import Conditions from "./Conditions.vue";

  import {findAllyByHsid} from "../js/heroSheetVersioning.js";

  export default {
    name: "CharacterSheet",
    components: {
      TabDisplay,
      Campaign,
      Background,
      BasicStats,
      Defenses,
      Skills,
      Advantages,
      Equipment,
      OverallCosts,
      PowerListTopLevel,
      Complications,
      Attacks,
      Adjustments,
      ConstraintViolations,
      Conditions,
    },
    props: {
      charsheet: { type: Object, required: true },
      isAlly: { type: Boolean, required: false, default: false }
    },
    data: function() {
      return {
        allyShown: null,
      }
    },
    provide: function() {
      return {
        getCharsheet: () => this.charsheet,
        editModes: {
          isAlly: this.isAlly
        }
      };
    },
    methods: {
      findAllyByHsid,
    }
  }
</script>

<style scoped>
  .h-box {
    display: flex;
    flex-flow: row wrap;
  }
  .v-box {
    display: flex;
    flex-flow: column;
  }
  .title {
    text-align: center;
    flex-grow: 1;
    font-size: x-large;
    padding: 2px;
  }
</style>
