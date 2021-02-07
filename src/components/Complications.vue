<template>
  <boxed-section title="Complications">
    <template v-slot:exhibit>
      <local-cost-display/>
    </template>
    <div
        class="complications-list grid-with-lines"
        :class="{'deleteVisible': deleteIsVisible, 'reordering': reordering, 'normalMode': !deleteIsVisible && !reordering}"
    >
      <label v-if="reordering" class="grid-with-lines-no-lines"></label>
      <label class="col-label">Type</label>
      <label class="col-label">Complication</label>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>

      <div class="display-contents"
           v-for="(complication, index) in charsheet.complications"
           :key="index"
      >
        <drag-handle
            v-if="reordering"
            draggable-list-name="complications"
            :items="charsheet.complications"
            :item-index="index"
            class="grid-with-lines-no-lines"
        />
        <div class="complication-type" :class="{'isOutOfSpec': isOutOfSpec(complication)}">
          <select-entry
              v-model="complication.complicationType"
              :options="Object.entries(complicationsData.complicationTypes)"
              unselected-item="Select One"
              :getValue="x => x[0]"
              :getDisplay="x => x[1].name"
          />
        </div>
        <string-entry v-model="complication.description" class="grid-with-lines-cell"/>
        <edit-button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            :onClick="() => onDelete(complication)"
        >
          <trash-icon/>
        </edit-button>
      </div>
      <div class="empty-notice" v-if="charsheet.complications.length === 0">No Complications</div>
    </div>
    <div class="scrolling-list-footer">
      <edit-button :onClick="addComplication">Add Complication</edit-button>
      <edit-button v-if="charsheet.complications.length > 0 && !reordering" :onClick="() => deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </edit-button>
      <edit-button v-if="charsheet.complications.length > 1 && !deleteIsVisible" :onClick="() => reordering = !reordering">
        <span v-if="reordering">Done Reordering</span>
        <span v-else>Reorder</span>
      </edit-button>
    </div>
    <div class="background">
      <label>Background / Bio / Story</label>
      <string-entry v-model="charsheet.background"/>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "@/components/LocalCostDisplay.vue";
  import DragHandle from "@/components/DragHandle.vue";
  import {newBlankComplication} from "@/js/heroSheetVersioning.js";
  const complicationsData = require("@/data/complicationsData.json");

  export default {
    name: "Complications",
    components: {
      LocalCostDisplay,
      DragHandle,
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        charsheet: this.getCharsheet(),
        complicationsData: complicationsData,
        deleteIsVisible: false,
        reordering: false,
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
  .complications-list.normalMode {
    grid-template-columns: max-content 1fr;
  }
  .complications-list.deleteVisible {
    grid-template-columns: max-content 1fr max-content;
  }
  .complications-list.reordering {
    grid-template-columns: max-content max-content 1fr;
  }
  div.scrolling-list-footer {
    background-color: var(--section-color);
    text-align: center;
    margin-top: 5px;
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
    margin-top: 4px;
  }
  .background label {
    font-weight: bold;
  }
  .background textarea {
    flex-grow: 1;
  }
  .trash-button {
    background-color: var(--paper-color);
    padding: 0;
    margin: 0;
  }
</style>