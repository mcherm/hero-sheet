<!--
  A widget to generate a select dropdown within a hero-sheet charsheet.
  This differs from a standard select element in that it can be disabled
  or read-only just like other data entry fields and is rendered accordingly.
-->
<template>
  <div class="select-background" :class="{'read-only': isReadOnly}">
    <select v-on:change="$emit('input', $event.target.value)" :disabled="isReadOnly">
      <option v-if="unselectedItem !== null" disabled value="" :selected="value === ''">
        {{unselectedItem}}
      </option>
      <option
          v-for="option of options"
          :key="getValue(option)"
          :value="getValue(option)"
          :selected="getValue(option) === value"
          :to-select-a="getValue(option)"
          :to-select-b="value"
      >
        {{getDisplay(option)}}
      </option>
    </select>
  </div>
</template>

<script>
  export default {
    name: "SelectEntry",
    inject: ["editModes"],
    props: {
      mutable: { type: Boolean, required: false, default: true },
      value: { type: String, required: true },
      options: { type: Array, required: true },
      unselectedItem: {type: String, required: false, default: null }, // value to show if none is chosen
      getDisplay: { type: Function, required: false, default: x => x }, // function on items to give display string
      getValue: { type: Function, required: false, default: x => x }, // function on items to give value string (also unique key)
    },
    computed: {
      isReadOnly: function() {
        const globalReadOnly = this.editModes && ("isReadOnly" in this.editModes) && this.editModes.isReadOnly;
        return globalReadOnly;
      }
    }
  }
</script>

<style scoped>
  .select-background {
    background-color: var(--entry-field);
    padding: 2px;
  }
  .select-background.read-only {
    background-color: var(--paper-color);
  }
  select[disabled] {
    color: inherit;
  }
</style>
