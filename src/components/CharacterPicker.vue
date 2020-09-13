<template>
  <boxed-section title="Select Character" class="character-picker">
    <div class="h-box">
      <character-picker-own-characters :user="user" v-on:change-character="$emit('change-character', $event)"/>
      <character-picker-viewing :user="user" v-on:change-character="$emit('change-character', $event)"/>
    </div>
  </boxed-section>
</template>

<script>
  import CharacterPickerOwnCharacters from "./CharacterPickerOwnCharacters.vue";
  import CharacterPickerViewing from "./CharacterPickerViewing.vue";

  export default {
    name: "CharacterPicker",
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true }
    },
    components: {
      CharacterPickerOwnCharacters,
      CharacterPickerViewing,
    },
  }
</script>

<style scoped>
  .boxed-section .h-box {
    display: flex;
    flex-flow: row wrap;
    background-color: var(--section-color);
    margin: -8px;
  }
  .h-box * {
    margin: 8px;
  }
</style>