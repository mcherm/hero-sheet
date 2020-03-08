<template>
  <boxed-section :title="'Complications'">
    <div
        class="complications-list grid-with-lines"
        :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}"
    >
      <label class="col-label">Type</label>
      <label class="col-label">Complication</label>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

      <div class="display-contents"
           v-for="(complication, index) in complications"
           :key="index"
      >
        <div class="complication-type" :class="{'isOutOfSpec': isOutOfSpec(complication)}">
          <select v-model="complication.complicationType">
            <option value="" disabled>Select One</option>
            <option
                v-for="(complicationType, complicationTypeName) in complicationsData.complicationTypes"
                :key="complicationTypeName"
                :value="complicationTypeName"
            >{{complicationType.name}}</option>
          </select>
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
    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addComplication()">Add Complication</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </boxed-section>
</template>

<script>
  import {newBlankComplication} from "../js/heroSheetVersioning.js";

  const complicationsData = require("../data/complicationsData.json");

  export default {
    name: "Complications",
    props: {
      "complications": { type: Array, required: true }
    },
    data: function() {
      return {
        complicationsData: complicationsData,
        deleteIsVisible: false
      }
    },
    methods: {
      addComplication: function() {
        this.complications.push(newBlankComplication());
      },
      isOutOfSpec: function(complication) {
        return !Object.keys(complicationsData.complicationTypes).includes(complication.complicationType);
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
  .complication-type {
    background-color: var(--entry-field);
  }
  .isOutOfSpec {
    outline: var(--error-color) solid 4px;
    outline-offset: -4px;
  }
</style>