<template>
  <div class="header">
    <button class="about-button" v-on:click="showingAbout = true">About</button>
    <div class="title">
      <span v-if="userSelected">{{user}}</span>
      <span v-else>{{titleIfLoggedOut}}</span>
      <span v-if="characterSelected && characterName !== ''"> : {{characterName}}</span>
    </div>
    <activity-button v-if="characterSelected" :label="characterName" key="character" ref="characterButton">
      <select v-if="canChangeEditMode"  :value="editMode" @change="$emit('set-edit-mode', $event.target.value)">
        <option value="DESIGNING">Designing</option>
        <option value="PLAYING">Playing</option>
        <option value="READ_ONLY">Read Only</option>
      </select>
      <edit-button :on-click="() => {$refs.characterButton.concealContents(); $globals.eventBus.$emit('duplicate-current-character')}">Duplicate</edit-button>
      <edit-button :on-click="() => {$refs.characterButton.concealContents(); $emit('close-character')}">Close Character</edit-button>
    </activity-button>
    <activity-button v-if="userSelected" :label="user" key="user" ref="userButton">
      <edit-button :on-click="() => {$refs.userButton.concealContents(); $emit('reset-user')}">Log Out</edit-button>
    </activity-button>
    <modal-lightbox v-if="showingAbout" v-on:exit="showingAbout = false">
      <about-application/>
    </modal-lightbox>
  </div>
</template>

<script>
  import AboutApplication from "@/components/AboutApplication.vue"
  import ActivityButton from "@/components/ActivityButton.vue"

  export default {
    name: 'header-section',
    components: {
      AboutApplication,
      ActivityButton,
    },
    props: {
      titleIfLoggedOut: { type: String, required: true },
      characterSelected: { type: Boolean, required: true },
      characterName: { type: String, required: false, default: "" },
      userSelected: { type: Boolean, required: true },
      user: { type: String, required: false, default: "" },
      canChangeEditMode: { type: Boolean, required: true },
      editMode: { type: String, required: true },
    },
    data: function() {
      return {
        showingAbout: false,
      };
    },
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

  .about-button {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 4px 2px;
    background-color: var(--button-color);
  }

  .title {
    text-align: center;
    flex-grow: 1;
    font-size: x-large;
    padding: 2px;
  }
</style>
