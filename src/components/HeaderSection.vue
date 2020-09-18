<template>
  <div class="header">
    <button v-on:click="showingAbout = true">About</button>
    <div class="title">
      <span v-if="userSelected">{{user}}</span>
      <span v-else>{{titleIfLoggedOut}}</span>
      <span v-if="characterSelected && characterName !== ''"> : {{characterName}}</span>
    </div>
    <button v-if="characterSelected" @click="$emit('reset-character')" class="character-display">{{characterName}}</button>
    <button v-if="userSelected" @click="$emit('reset-user')" class="user-display">{{user}}</button>
    <modal-lightbox v-if="showingAbout" v-on:exit="showingAbout = false">
      <about-application/>
    </modal-lightbox>
  </div>
</template>

<script>
  import AboutApplication from "./AboutApplication.vue"

  export default {
    name: 'header-section',
    components: {
      AboutApplication
    },
    props: {
      titleIfLoggedOut: { type: String, required: true },
      characterSelected: { type: Boolean, required: true },
      characterName: { type: String, required: false, default: "" },
      userSelected: { type: Boolean, required: true },
      user: { type: String, required: false, default: "" },
    },
    data: function() {
      return {
        showingAbout: false,
      };
    }
  }
</script>

<style scoped>
  .header {
    border-bottom: solid 1px var(--box-border-color);
    margin-bottom: 5px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .header button {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 4px 2px;
  }

  .title {
    text-align: center;
    flex-grow: 1;
    font-size: x-large;
    padding: 2px;
  }
</style>
