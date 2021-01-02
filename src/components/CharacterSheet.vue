<!--
  Responsible for the actual display of a charsheet -- either of the main character OR
  of some ally.
-->
<template>
  <div class="character-sheet v-box">
    <tab-display v-if="charsheet !== null">
      <template slot="background">
        <div class="h-box">
          <campaign/>
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
      <template slot="adjustments">
        <div class="v-box">
          <adjustments/>
          <constraint-violations/>
        </div>
      </template>
      <template slot="In Play">
        <div class="v-box">
          <attacks/>
          <boxed-section title="Senses">
            <senses-chart/>
          </boxed-section>
          <ranks-and-measures/>
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
        :edit-mode="editMode"
      />
    </modal-lightbox>
  </div>
</template>

<script>
  import TabDisplay from "@/components/TabDisplay.vue";
  import Campaign from "@/components/Campaign.vue"
  import Background from "@/components/Background.vue"
  import BasicStats from "@/components/BasicStats.vue"
  import Defenses from "@/components/Defenses.vue"
  import Skills from "@/components/Skills.vue"
  import Advantages from "@/components/Advantages.vue"
  import Equipment from "@/components/Equipment.vue";
  import OverallCosts from "@/components/OverallCosts.vue"
  import PowerListTopLevel from "@/components/PowerListTopLevel.vue"
  import Complications from "@/components/Complications.vue";
  import Attacks from "@/components/Attacks.vue"
  import SensesChart from "@/components/SensesChart.vue"
  import Adjustments from "@/components/Adjustments.vue";
  import ConstraintViolations from "@/components/ConstraintViolations.vue";
  import Conditions from "@/components/Conditions.vue";
  import RanksAndMeasures from "@/components/RanksAndMeasures";

  import {findAllyByHsid} from "@/js/heroSheetVersioning.js";

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
      SensesChart,
      RanksAndMeasures,
      Adjustments,
      ConstraintViolations,
      Conditions,
    },
    props: {
      charsheet: { type: Object, required: true },
      editMode: { type: String, required: true },
      isAlly: { type: Boolean, required: false, default: false }
    },
    data: function() {
      return {
        allyShown: null,
        editModes: {
          editMode: this.editMode,
          isAlly: this.isAlly,
        }
      }
    },
    provide: function() {
      return {
        getCharsheet: () => this.charsheet,
        editModes: this.editModes,
      };
    },
    methods: {
      findAllyByHsid,
    },
    watch: {
      editMode: function(val) {
        this.$set(this.editModes, "editMode", val);
      },
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
