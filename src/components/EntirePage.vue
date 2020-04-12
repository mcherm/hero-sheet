<template>
  <div>
    <div class="header">
      <button v-on:click="showingAbout = true">About</button>
      <div class="title">Hero Sheet<span v-if="characterSelected && characterName !== ''"> : {{characterName}}</span></div>
      <button v-if="characterSelected" @click="resetCharacter()" class="character-display">{{characterName}}</button>
      <button v-if="userSelected" @click="resetUser()" class="user-display">{{user}}</button>
    </div>
    <modal-lightbox v-if="showingAbout" v-on:exit="showingAbout = false">
      <about-application/>
    </modal-lightbox>
    <user-login
        v-if="!userSelected"
        :user="user"
        v-on:change-user="setUser($event)"
    />
    <character-picker
        v-if="userSelected && !characterSelected"
        :user="user"
        :characterId="characterId"
        v-on:change-character="setCharacterId($event)"
        v-on:not-logged-in="resetUser()"
    />
    <character-sheet
        v-if="userSelected && characterSelected"
        :user="user"
        :characterId="characterId"
        v-on:change-character-name="characterName = $event"
        v-on:not-logged-in="resetUser()"
    />
  </div>
</template>

<script>
  import AboutApplication from "./AboutApplication";
  import CharacterPicker from "./CharacterPicker.vue";
  import CharacterSheet from "./CharacterSheet.vue";
  import UserLogin from "./UserLogin";

  import {restoreSession, endSession} from "../js/api.js";

  export default {
    name: "EntirePage",
    components: {
      UserLogin,
      AboutApplication,
      CharacterPicker,
      CharacterSheet
    },
    data: function() {
      return {
        userSelected: false,
        user: "",
        characterSelected: false,
        characterId: "",
        characterName: "",
        showingAbout: false
      }
    },
    created: async function() {
      try {
        const restoreSessionResponse = await restoreSession();
        if (restoreSessionResponse.isValid) {
          this.setUser(restoreSessionResponse.user);
        } else {
          // Not value, but we can still use the user to prefill the login screen
          console.log("Existing session not valid; will request a login.");
          this.user = restoreSessionResponse.user || "";
        }
      } catch(err) {
        console.log(`The attempt to restore session failed`, err); // FIXME: Remove
        // The attempt to restore session failed; proceed without a live session
      }
    },
    methods: {
      setUser: function(newUser) {
        this.user = newUser;
        this.userSelected = true;
      },
      setCharacterId: function(newCharacter) {
        this.characterId = newCharacter.characterId;
        this.characterName = newCharacter.name;
        this.characterSelected = true;
      },
      resetUser: function() {
        endSession();
        this.userSelected = false;
        this.characterSelected = false;
        this.characterId = "";
        this.characterName = "";
      },
      resetCharacter: function() {
        this.characterSelected = false;
      }
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
  }
</style>