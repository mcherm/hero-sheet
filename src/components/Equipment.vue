<template>
  <boxed-section title="Equipment">
    <template v-slot:exhibit>
      <div class="horizontal">
        <div class="equipment-cost grid-with-lines paper">
          <label class="row-label ">equipment</label>
          <div class="horizontal">
            <number-display :value="totalEQCost"/>
            <span class="">EQ costs</span>
            <number-display :value="equipmentCost(getCharsheet())"/>
          </div>
        </div>
        <local-cost-display/>
      </div>
    </template>
    <div
        class="equipment-list grid-with-lines"
        :class="{'deleteVisible': deleteIsVisible, 'reordering': reordering, 'normalMode': !deleteIsVisible && !reordering}"
    >
      <div v-if="reordering" class="grid-with-lines-no-lines"></div>
      <div class="col-label"></div>
      <div class="col-label">Item</div>
      <div class="col-label">Description</div>
      <div class="col-label">EQ</div>
      <div v-if="deleteIsVisible" class="grid-with-lines-no-lines"></div>
      <div
          v-for="(item, itemIndex) in equipment"
          :key="item.hsid"
          class="display-contents"
      >
        <drag-handle
            v-if="reordering"
            draggable-list-name="equipment"
            :items="equipment"
            :item-index="itemIndex"
            class="drag-area grid-with-lines-no-lines"
            :class="{'open': showFeatureDetails[item.hsid]}"
        />
        <div :class="{'feature-control': true, 'open': showFeatureDetails[item.hsid]}">
          <edit-button
              v-if="item.feature"
              class="invisible"
              :onClick="() => toggleMechanics(item)"
              :isNavigation="true">
            <mechanics-icon/>
          </edit-button>
        </div>

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
        <string-entry v-else-if="item.source === 'custom'" :value="item.name" @input="setItemName(item, $event)"/>
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
        <number-entry v-else-if="item.source === 'custom' && item.feature === null" class="equipment-cost" v-model="item.cost"/>
        <number-display v-else-if="item.source === 'custom' && item.feature !== null" class="equipment-cost" :value="item.cost"/>
        <div v-else class="error">ERROR: '{{item.source}}' not supported</div>

        <edit-button
            v-if="deleteIsVisible"
            class="trash-button grid-with-lines-no-lines"
            :class="{'open': showFeatureDetails[item.hsid]}"
            :onClick="() => onDelete(item)"
        >
          <trash-icon/>
        </edit-button>
        <div v-if="showFeatureDetails[item.hsid]" class="feature-details">
          <power
              :power="item.feature"
              :inherited-modifier-lists="[]"
              :mutable="item.source === 'custom'"
              v-on:update:name="setFeatureName(item, $event)"
          />
        </div>
      </div>
      <div class="empty-notice" v-if="equipment.length === 0">No Equipment</div>
    </div>
    <div class="scrolling-list-footer">
      <edit-button :onClick="addEquipment">Add Equipment</edit-button>
      <edit-button v-if="equipment.length > 0 && !reordering" :onClick="() => deleteIsVisible = !deleteIsVisible">
        <span v-if="deleteIsVisible">Done Deleting</span>
        <span v-else>Delete</span>
      </edit-button>
      <edit-button v-if="equipment.length > 1 && !deleteIsVisible" :onClick="() => reordering = !reordering">
        <span v-if="reordering">Done Reordering</span>
        <span v-else>Reorder</span>
      </edit-button>
    </div>
  </boxed-section>
</template>

<script>
  import LocalCostDisplay from "@/components/LocalCostDisplay.vue";
  import MechanicsIcon from "@/components/MechanicsIcon.vue";
  import DragHandle from "@/components/DragHandle.vue";
  import {newBlankEquipment, newBlankPower, STARTING_POWER_NAME} from "@/js/heroSheetVersioning.js";
  import {buildFeature, equipmentCost, createUpdatersForFeature} from "@/js/heroSheetUtil.js";

  const standardEquipment = require("@/data/standardEquipment.json");

  export default {
    name: "Equipment.vue",
    components: {
      LocalCostDisplay,
      MechanicsIcon,
      DragHandle,
    },
    inject: ["getCharsheet"],
    data: function() {
      return {
        standardEquipment,
        deleteIsVisible: false,
        reordering: false,
        showFeatureDetails: {},
        equipment: this.getCharsheet().equipment
      }
    },
    computed: {
      totalEQCost: function() {
        return this.equipment.map(x => x.cost).reduce((x, y) => x + y, 0);
      }
    },
    methods: {
      equipmentCost,
      addEquipment: function() {
        const newEquipment = newBlankEquipment();
        this.equipment.push(newEquipment);
      },
      selectItem: function(item, selected) {
        const selectedFields = selected.split(":");
        const source = selectedFields[0];
        if (source === "standard") {
          item.source = source;
          item.name = selectedFields[1];
          const stdEq = standardEquipment[item.name];
          item.cost = stdEq.cost;
          const standardFeature = stdEq.feature;
          if (standardFeature) {
            item.feature = buildFeature(standardFeature, []);
            if (item.cost === undefined || item.cost === null) {
              item.cost = item.feature.cost; // Default to the feature cost if item cost is not specified
            }
            createUpdatersForFeature(this.$globals, this.getCharsheet(), item.feature);
          } else {
            this.$delete(item, "feature");
          }
        } else if (source === "custom") {
          item.source = source;
          this.$set(item, "description", "");
          item.cost = 0;
          if (selectedFields[1] === "powered") {
            item.feature = newBlankPower();
            const newUpdaterEvent = {
              charsheet: this.getCharsheet(),
              updater: "EquipmentFeatureUpdater",
              item: item
            };
            this.$globals.eventBus.$emit("new-updater", newUpdaterEvent);
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
        this.$delete(this.equipment, this.equipment.indexOf(item));
        if (this.equipment.length === 0) {
          this.deleteIsVisible = false;
        }
      },
      toggleMechanics: function(item) {
        this.$set(this.showFeatureDetails, item.hsid, !this.showFeatureDetails[item.hsid]);
      },
      setItemName: function(item, newName) {
        item.name = newName;
        // make the feature name match if it hasn't already been named
        if (item.feature !== null && item.feature.name === STARTING_POWER_NAME) {
          this.setFeatureName(item, newName);
        }
      },
      setFeatureName: function(item, newName) {
        const cleanedNewName = newName.replace(/\|/g, ""); // replace all "|"s with "".
        item.feature.name = cleanedNewName;
        // make the item name match if it hasn't already been named
        if (item.name === "") {
          this.setItemName(item, cleanedNewName);
        }
      }
    }
  }
</script>

<style scoped>
  .horizontal {
    display: flex;
    align-items: baseline;
  }
  .equipment-cost {
    grid-template-columns: max-content max-content;
    margin: 0;
  }
  .paper {
    background-color: var(--paper-color);
  }
  .equipment-list.normalMode {
    grid-template-columns: max-content max-content 1fr max-content;
  }
  .equipment-list.deleteVisible {
    grid-template-columns: max-content max-content 1fr max-content max-content;
  }
  .equipment-list.reordering {
    grid-template-columns: max-content max-content max-content 1fr max-content;
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
  .name {
    padding: 2px;
  }
  .description {
    padding: 2px;
  }
  .error {
    background-color: var(--error-color);
  }
  .invisible {
    background: transparent;
    border: none;
  }
  .equipment-list.normalMode .feature-details {
    grid-column: 2/-1;
  }
  .equipment-list.deleteVisible .feature-details {
    grid-column: 2/-2;
  }
  .equipment-list.reordering .feature-details {
    grid-column: 3/-1;
  }
  .feature-control button {
    align-self: end;
  }
  .feature-control.open {
    grid-row-end: span 2;
  }
  .trash-button {
    background-color: var(--paper-color);
  }
  .trash-button.open {
    grid-row-end: span 2;
  }
  .drag-area.open {
    grid-row-end: span 2;
  }
</style>