<template>
  <senses-chart :power="power" :mutable="chartIsMutable"/>
</template>

<script>
  import SensesChart from "./SensesChart.vue";

  export default {
    name: "PowerLayoutSenses",
    inject: {
      editModes: { default: {} }
    },
    components: {
      SensesChart,
    },
    props: {
      power: { type: Object, required: true },
      mutable: { type: Boolean, required: false, default: true }
    },
    computed: {
      chartIsMutable: function() {
        return this.mutable && this.editModes && this.editModes.editMode === "DESIGNING";
      }
    }
  }
</script>

<style scoped>
</style>
