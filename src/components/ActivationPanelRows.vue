<!--
  Recursive widget used within the ActivationPanel that generates the powers in a power list.
-->
<template>
  <div class="display-contents">
    <div v-for="power in displayedPowers" :key="power.hsid" class="display-contents">
      <div class="activate-pane">
        <activation-widget
            :activation="power.activation"
            :can-be-partial="getStandardPower(power).canBePartial"
            :horizontal="true"
            @setFeatureActivation="setFeatureActivation(getCharsheet(), power, [], $event)"
        />
      </div>
      <div class="power" :class="powerStateClasses(power)">
        <span v-for="x of Array(indentLevel)" class="indent"/>
        {{power.name}}
      </div>
      <activation-panel-rows
          v-if="isArray(power)"
          :powerList="power.subpowers"
          :indent-level="indentLevel + 1"
          :activation-panel-mode="activationPanelMode"
      />
    </div>
    <div class="empty-notice" v-if="indentLevel === 0 && displayedPowers.length === 0">No Active Powers</div>
  </div>
</template>

<script>
  import {setFeatureActivation, getStandardPower, powerStateClasses} from "@/js/heroSheetUtil.js";
  import ActivationWidget from "@/components/ActivationWidget.vue";

  export default {
    name: "ActivationPanelRow",
    components: {
      ActivationWidget
    },
    inject: ["getCharsheet"],
    props: {
      powerList: { type: Array, required: true },
      indentLevel: { type: Number, required: true },
      activationPanelMode: { type: String, required: true },
    },
    computed: {
      displayedPowers: function() {
        return this.powerList.filter(p => getStandardPower(p) !== null && this.showPower(p));
      }
    },
    methods: {
      setFeatureActivation,
      getStandardPower,
      powerStateClasses,
      isArray: function(power) {
        const standardPower = getStandardPower(power);
        return standardPower && standardPower.powerLayout === 'array';
      },
      showPower: function(power) {
        return this.indentLevel > 0 || this.activationPanelMode === "ALL_POWERS" || this.isArray(power);
      },
    }
  }
</script>

<style scoped>
  .activate-pane {
    border: 1px solid var(--grid-line-color);
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .power {
    border: 1px solid var(--grid-line-color);
    padding: 2px;
    display: flex;
    align-items: center;
  }
  span.indent {
    margin-left: 20px;
  }
  .power.off {
    border-style: dashed;
    background-color: var(--subtle-shade-color);
  }
  .power.partial {
    border-style: dotted;
  }
  .power.partial.off {
    border-style: dotted;
  }
</style>
