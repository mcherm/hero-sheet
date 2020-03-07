<template>
  <div class="display-contents">
    <div class="grid-with-lines-cell">
      {{complicationsData.complicationTypes[complication.complicationType].name}}
    </div>
    <string-entry v-model="complication.description" class="grid-with-lines-cell"/>
    <button
        v-if="deleteIsVisible"
        class="trash-button grid-with-lines-no-lines"
        v-on:click="$delete(complications, complications.indexOf(complication))"
    >
      <trash-icon/>
    </button>
  </div>
</template>

<script>
  import TrashIcon from "./TrashIcon.vue"
  import DocsLookup from "./DocsLookup.vue"
  const complicationsData = require("../data/complicationsData.json");

  export default {
    name: "ComplicationsRow.vue",
    components: {
      TrashIcon,
      DocsLookup
    },
    data: function() {
      return {
        complicationsData
      }
    },
    props: {
      complication: { type: Object, required: true },
      complications: { type: Array, required: true },
      deleteIsVisible: { type: Boolean, required: true }
    },
  }
</script>

<style scoped>
  div.display-contents {
    display: contents;
  }
</style>