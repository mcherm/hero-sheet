<template>
  <boxed-section title="Complications">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet"/>
    </template>
    <div
        class="complications-list grid-with-lines"
        :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}"
    >
      <label class="col-label">Type</label>
      <label class="col-label">Complication</label>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

      <div class="display-contents"
           v-for="(complication, index) in charsheet.complications"
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
            v-on:click="onDelete(complication)"
        >
          <trash-icon/>
        </button>
      </div>
      <div class="empty-notice" v-if="charsheet.complications.length === 0">No Complications</div>
    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addComplication()">Add Complication</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
    <div class="background">
      <label>Background / Bio / Story</label>
      <multiline-string-entry v-model="charsheet.background"/>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";
  import {newBlankComplication} from "../js/heroSheetVersioning.js";
  const complicationsData = require("../data/complicationsData.json");

  export default {
    name: "Complications",
    components: {
      LocalCostDisplay
    },
    props: {
      "charsheet": { type: Object, required: true }
    },
    data: function() {
      return {
        complicationsData: complicationsData,
        deleteIsVisible: false
      }
    },
    methods: {
      addComplication: function() {
        this.charsheet.complications.push(newBlankComplication());
      },
      isOutOfSpec: function(complication) {
        return !Object.keys(complicationsData.complicationTypes).includes(complication.complicationType);
      },
      onDelete: function(complication) {
        const complications = this.charsheet.complications;
        this.$delete(complications, complications.indexOf(complication));
        if (complications.length === 0) {
          this.deleteIsVisible = false;
        }
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
  .background {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    border: solid 2px var(--box-border-color);
    padding: 2px;
    min-height: 10em;
  }
  .background label {
    font-weight: bold;
  }
  .background textarea {
    flex-grow: 1;
  }
</style>