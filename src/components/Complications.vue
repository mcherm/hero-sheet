<template>
  <BoxedSection :title="'Complications'">
    <div
        class="complications-list grid-with-lines"
        :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}"
    >
      <label class="col-label">Type</label>
      <label class="col-label">Complication</label>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>
      <tr
          v-for="(complication, index) in complications"
          :key="index"
          is="ComplicationsRow"
          :complication="complication"
          :complications="complications"
          :deleteIsVisible="deleteIsVisible"
      />
    </div>
    <div class="scrolling-list-footer">
      <select v-model="selectedComplicationTypeToAdd">
        <option
            v-for="(complicationType, complicationTypeName) in complicationsData.complicationTypes"
            :key="complicationTypeName"
            :value="complicationTypeName"
        >{{complicationType.name}}</option>
      </select>
      <button v-on:click="addComplication()">Add Complication</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </BoxedSection>
</template>

<script>
  import ComplicationsRow from "./ComplicationsRow";
  const complicationsData = require("../data/complicationsData.json");

  export default {
    name: "Complications.vue",
    components: {
      ComplicationsRow
    },
    props: {
      "complications": { type: Array, required: true }
    },
    data: function() {
      return {
        complicationsData,
        deleteIsVisible: false,
        selectedComplicationTypeToAdd: "motivation"
      }
    },
    methods: {
      addComplication: function() {
        const newComplication = {
          complicationType: this.selectedComplicationTypeToAdd,
          description: ""
        };
        this.complications.push(newComplication);
      }
    }
  }
</script>

<style scoped>
  .complications-list.deleteVisible {
    grid-template-columns: max-content 1fr max-content;
  }
  .complications-list.deleteInvisible {
    grid-template-columns: max-content 1fr;
  }
  div.scrolling-list-footer {
    background-color: var(--section-color);
    text-align: center;
    margin-top: 5px;
  }
</style>