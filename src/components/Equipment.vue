<template>
  <boxed-section title="Equipment">
    <template v-slot:exhibit>
      <local-cost-display :charsheet="charsheet" extra-label="equipment" :extra-value-function="equipmentCost"/>
    </template>
    <div class="equipment-list grid-with-lines" :class="{ 'deleteNotVisible': !deleteIsVisible, 'deleteVisible': deleteIsVisible}">
      <div class="col-label"></div>
      <div class="col-label">Item</div>
      <div class="col-label">Description</div>
      <div class="col-label">Cost</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>
      <div
          v-for="item in charsheet.equipment"
          :key="item.hsid"
          class="display-contents"
      >
        <div :class="{'feature-control': true, 'open': showFeatureDetails[item.hsid]}"><button v-if="item.feature" class="invisible" @click="toggleMechanics(item)"><mechanics-icon/></button></div>

        <div v-if="item.source === 'unselected'">
          <select @change="selectItem(item, $event.target.value)">
            <option disabled selected value="">Select Item</option>
            <optgroup label="Custom">
              <option value="custom:simple">Simple Equipment</option>
              <option value="custom:powered">Powered Equipment</option>
            </optgroup>
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
        <string-entry v-else-if="item.source === 'custom'" v-model="item.name"/>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>

        <div v-if="item.source === 'unselected'" class="inapplicable"/>
        <div v-else-if="item.source === 'standard'" class="description">
          {{standardEquipment[item.name].description}}
          <docs-lookup :docsURL="standardEquipment[item.name].docsURL"/>
        </div>
        <string-entry v-else-if="item.source === 'custom'" class="description" v-model="item.description"/>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>

        <div v-if="item.source === 'unselected'" class="equipment-cost inapplicable"/>
        <number-display v-else-if="item.source === 'standard'" class="equipment-cost" :value="item.cost"/>
        <number-entry v-else-if="item.source === 'custom'" class="equipment-cost" v-model="item.cost"/>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>

        <button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            :class="{'open': showFeatureDetails[item.hsid]}"
            v-on:click="onDelete(item)"
        >
          <trash-icon/>
        </button>
        <div v-if="showFeatureDetails[item.hsid]" class="feature-details">
          <power :power="item.feature" :mutable="item.source === 'custom'" />
        </div>
      </div>
      <div class="empty-notice" v-if="charsheet.equipment.length === 0">No Equipment</div>
    </div>
    <div class="scrolling-list-footer">
      <button v-on:click="addEquipment()">Add Equipment</button>
      <button v-if="charsheet.equipment.length > 0" v-on:click="deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </button>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "./LocalCostDisplay.vue";
  import MechanicsIcon from "./MechanicsIcon.vue";
  import {newBlankEquipment, newBlankPower} from "../js/heroSheetVersioning.js";
  import {equipmentCost, buildFeature, powerUpdaterEvent} from "../js/heroSheetUtil.js";
  const standardEquipment = require("../data/standardEquipment.json");

  export default {
    name: "Equipment.vue",
    components: {
      LocalCostDisplay,
      MechanicsIcon
    },
    props: {
      charsheet: { type: Object, required: true }
    },
    data: function() {
      return {
        standardEquipment,
        deleteIsVisible: false,
        showFeatureDetails: {}
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
        } else if (source === "custom") {
          item.source = source;
          this.$set(item, "description", "");
          item.cost = 0;
          if (selectedFields[1] === "powered") {
            item.feature = newBlankPower();
            const newUpdaterEvent = {
              updater: "EquipmentFeatureUpdater",
              item: item
            };
            this.$emit("newUpdater", newUpdaterEvent);
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
      },
      toggleMechanics: function (item) {
        this.$set(this.showFeatureDetails, item.hsid, !this.showFeatureDetails[item.hsid]);
      }
    }
  }
</script>

<style scoped>
  .equipment-list.deleteNotVisible {
    grid-template-columns: max-content max-content 1fr max-content;
  }
  .equipment-list.deleteVisible {
    grid-template-columns: max-content max-content 1fr max-content max-content;
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
  button.invisible {
    background: transparent;
    border: none;
  }
  .equipment-list.deleteNotVisible .feature-details {
    grid-column: 2/-1;
  }
  .equipment-list.deleteVisible .feature-details {
    grid-column: 2/-2;
  }
  .feature-control button {
    align-self: end;
  }
  .feature-control.open {
    grid-row-end: span 2;
  }
  .trash-button.open {
    grid-row-end: span 2;
  }
</style>