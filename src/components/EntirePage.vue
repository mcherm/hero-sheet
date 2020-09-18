<template>
  <div>
    <logo-section/>
    <header-section
        title-if-logged-out="Log In"
        :character-name="characterName"
        :character-selected="characterSelected"
        :user="user"
        :user-selected="userSelected"
        @reset-character="resetCharacter()"
        @reset-user="resetUser()"
    />
    <user-login
        v-if="!userSelected"
        :prefillUser="user"
        v-on:change-user="setUser($event)"
    />
    <character-picker
        v-if="userSelected && !characterSelected"
        :user="user"
        :characterId="characterId"
        v-on:change-character="changeCharacter($event)"
        v-on:not-logged-in="resetUser()"
    />
    <character-container
        v-if="userSelected && characterSelected"
        :user="user"
        :characterId="characterId"
        :owningUser="owningUser"
        v-on:change-character-name="characterName = $event"
        v-on:not-logged-in="resetUser()"
    />
  </div>
</template>

<script>
  import CharacterPicker from "./CharacterPicker.vue";
  import CharacterContainer from "./CharacterContainer.vue";
  import UserLogin from "./UserLogin";
  import LogoSection from "@/components/LogoSection";
  import HeaderSection from "@/components/HeaderSection";

  import {endSession, restoreSession} from "../js/api.js";

  export default {
    name: "EntirePage",
    components: {
      LogoSection,
      HeaderSection,
      UserLogin,
      CharacterPicker,
      CharacterContainer
    },
    data: function() {
      return {
        userSelected: false,
        user: "",
        characterSelected: false,
        characterId: "",
        owningUser: null, // when characterSelected, this is null if owned by the current user, or a user name of the owner
        characterName: "",
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
        console.log(`The attempt to restore session failed`, err);
        // The attempt to restore session failed; proceed without a live session
      }
    },
    methods: {
      setUser: function(newUser) {
        this.user = newUser;
        this.userSelected = true;
      },
      changeCharacter: function(newCharacter) {
        this.characterId = newCharacter.characterId;
        this.characterName = newCharacter.name;
        this.owningUser = newCharacter.owningUser;
        this.characterSelected = true;
      },
      resetUser: async function() {
        await endSession();
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
  .header button {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 4px 2px;
  }
</style>