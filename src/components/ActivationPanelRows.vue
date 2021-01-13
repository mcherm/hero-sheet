<!--
  Recursive widget used within the ActivationPanel that generates the powers in a power list.
-->
<template>
  <div class="display-contents">
    <div v-for="power in definedPowers" class="display-contents">
      <div class="activate-pane">
        <activation-widget
            :activation="power.activation"
            :can-be-partial="getStandardPower(power).canBePartial"
            @setFeatureActivation="setFeatureActivation(getCharsheet(), power, [], $event)"
        />
      </div>
      <div class="power" :class="powerStateClasses(power)">
        <span v-for="x of Array(indentLevel)" class="indent"/>
        {{power.name}}
      </div>
      <activation-panel-rows
          v-if="getStandardPower(power).powerLayout === 'array'"
          :powerList="power.subpowers"
          :indent-level="indentLevel + 1"
      />
    </div>
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
    },
    computed: {
      definedPowers: function() {
        return this.powerList.filter(p => getStandardPower(p) !== null);
      }
    },
    methods: {
      setFeatureActivation,
      getStandardPower,
      powerStateClasses,
    }
  }
</script>

<style scoped>
  .activate-pane {
    border: 1px solid var(--grid-line-color);
  }
  .power {
    border: 1px solid var(--grid-line-color);
    padding: 2px;
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
