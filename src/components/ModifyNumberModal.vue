<template>
  <div class="modify-number-modal">
    <h1>Manually Modify a Value</h1>
    <p class="usage-notes">
      Mutants and Masterminds sometimes requires special exceptions. This allows
      you to modify a value by adding or subtracting a fixed amount from it, even
      if the rules do not directly call for it. You should generally obtain GM
      permission before doing so.
    </p>
    <div class="entry-form grid-with-lines">
      <label class="col-label">Change to apply:</label>
      <number-entry :value="value.value" v-on:input="onValueInput"/>
      <label class="col-label">Description:</label>
      <string-entry :value="value.description" v-on:input="onDescriptionInput"/>
    </div>
  </div>
</template>

<script>
  export default {
    name: "ModifyNumberModal",
    props: {
      value: { type: Object, required: true }, // must be {value:int, description: string}
    },
    methods: {
      onValueInput: function(newValue) {
        const newModalData = {...this.value, value: newValue};
        this.$emit("input", newModalData);
      },
      onDescriptionInput: function(newDescription) {
        const newModalData = {...this.value, description: newDescription};
        this.$emit("input", newModalData);
      }
    }
  }
</script>

<style scoped>
  .modify-number-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .usage-notes {
    text-align: left;
    max-width: 500px;
  }
  .entry-form {
    display: grid;
    grid-template-columns: max-content max-content;
  }
</style>
