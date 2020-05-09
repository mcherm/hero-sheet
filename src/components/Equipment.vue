<template>
  <boxed-section title="Equipment">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet" extra-label="equipment" :extra-value-function="equipmentCost"/>
    </template>
    <div class="equipment-list grid-with-lines" :class="{ 'deleteInvisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}">
      <div class="col-label">Item</div>
      <div class="col-label">Description</div>
      <div class="col-label">Cost</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>
      <div
          v-for="item in charsheet.equipment"
          :key="item.hsid"
          class="display-contents"
      >
        <div v-if="item.source === 'unselected'">
          <select @change="selectItem(item, $event.target.value)">
            <option disabled selected value="">Select Item</option>
            <optgroup v-for="category in standardEquipmentCategories()" :label="category">
              <option
                  v-for="standardItem in itemsInCategory(category)"
                  :key="standardItem.name"
                  :value="`standard:${standardItem.name}`"
              >{{standardItem.name}}</option>
            </optgroup>
          </select>
        </div>
        <div v-else-if="item.source === 'standard'" class="name">{{item.name}}</div>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>
        <div v-if="item.source === 'unselected'" class="inapplicable"/>
        <div v-else-if="item.source === 'standard'" class="description">{{standardEquipment[item.name].description}}</div>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>
        <number-display class="equipment-cost" :value="item.cost"/>
        <button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            v-on:click="onDelete(item)"
        >
          <trash-icon/>
        </button>
      </div>
      <div class="empty-notice" v-if="charsheet.equipment.length === 0">No Equipment</div>
    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addEquipment()">Add Equipment</button>
      <button v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";
  import {newBlankEquipment} from "../js/heroSheetVersioning.js";
  import {equipmentCost, buildFeature, powerUpdaterEvent} from "../js/heroSheetUtil.js";
  const standardEquipment = require("../data/standardEquipment.json");

  export default {
    name: "Equipment.vue",
    components: {
      LocalCostDisplay
    },
    props: {
      charsheet: { type: Object, required: true }
    },
    data: function() {
      return {
        standardEquipment,
        deleteIsVisible: false
      }
    },
    methods: {
      equipmentCost,
      addEquipment: function() {
        const newEquipment = newBlankEquipment();
        this.charsheet.equipment.push(newEquipment);
      },
      selectItem: function(item, selected) {
        const selectedFields = selected.split(":");
        const source = selectedFields[0];
        if (source === "standard") {
          item.source = source;
          item.name = selectedFields[1];
          item.cost = standardEquipment[item.name].cost;
          const standardFeature = standardEquipment[item.name].feature;
          if (standardFeature === null) {
            item.feature = null;
          } else {
            item.feature = buildFeature(standardFeature);
            const event = powerUpdaterEvent(item.feature);
            if (event !== null) {
              this.$emit("newUpdater", event);
            }
          }
        } else {
          throw Error(`Unexpected source value of '${source}`);
        }
      },
      standardEquipmentCategories: function () {
        return new Set(Object.values(standardEquipment).map(item => item.category));
      },
      itemsInCategory: function(category) {
        return Object.values(standardEquipment).filter(item => item.category === category);
      },
      onDelete: function(item) {
        const equipment = this.charsheet.equipment;
        this.$delete(equipment, equipment.indexOf(item));
        if (equipment.length === 0) {
          this.deleteIsVisible = false;
        }
      }
    }
  }
</script>

<style scoped>
  .equipment-list.deleteInvisible {
    grid-template-columns: max-content 1fr max-content;
  }
  .equipment-list.deleteVisible {
    grid-template-columns: max-content 1fr max-content max-content;
  }
  div.scrolling-list-footer {
    background-color: var(--section-color);
    text-align: center;
    margin-top: 5px;
  }
  .equipment-list .equipment-cost {
    margin-left: 0;
  }
  .inapplicable {
    background-color: var(--inapplicable-color);
  }
  .trash-button {
    margin: 1px 5px;
    flex: 0;
  }
  .name {
    padding: 2px;
  }
  .description {
    padding: 2px;
  }
  .error {
    background-color: var(--error-color);
  }
</style>