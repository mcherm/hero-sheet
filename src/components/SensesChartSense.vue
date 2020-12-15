<!--
  A single sense row within the senses chart.
-->
<template>
  <div class="sense" :class="{'created-here': isSenseCreatedHere}">
    <span class="sense-name">
      {{sense.name}}
      <span v-if="isSenseCreatedHere">({{costOfSense()}})</span> <!-- FIXME: Wrong cost -->
    </span>
    <senses-chart-quality-list :qualities="sense.qualities" :isSenseType="false" :mutable="mutable"/>
  </div>
</template>

<script>
  import SensesChartQualityList from "./SensesChartQualityList.vue";
  const sensesData = require("@/data/sensesData.json");

  export default {
    name: "SensesChartSense",
    components: {
      SensesChartQualityList,
    },
    props: {
      sense: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true },
      isSenseCreatedHere: { type: Boolean, required: true },
    },
    methods: {
      costOfSense: function() {
        return sensesData.senses[this.sense.name].cost;
      },
    },
  }
</script>

<style scoped>
  .sense {
    padding: 2px;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .sense-name {
    margin: 2px 15px 2px 12px;
  }

  .sense.created-here {
    background: var(--entry-field);
  }
</style>