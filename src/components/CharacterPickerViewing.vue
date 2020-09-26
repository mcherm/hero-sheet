<!--
  Loads and renders the list of characters belonging to other users that the
  current user is set up to view. Also allows the user to pick one of these
  to view.
-->
<template>
  <div class="character-picker-viewing">
    <div v-if="viewing === null" class="placeholder">Loading...</div>
    <div v-if="viewing !== null && viewing.publicViewedUsers.length === 0" class="no-data">No access to public characters</div>
    <div v-if="viewing !== null && viewing.publicViewedUsers.length > 0" class="grid-with-lines viewing">
      <div v-for="(viewedUser, index) of viewing.publicViewedUsers" :key="viewedUser"  class="display-contents">
        <div v-if="index !== 0" class="user-divider"></div>
        <div class="userHeading">{{viewedUser}}</div>
        <div class="grid-with-lines-cell col-label">Campaign</div>
        <div class="grid-with-lines-cell col-label">Name</div>
        <div class="grid-with-lines-cell col-label"></div>
        <div v-for="character in publicCharacters[viewedUser]" class="display-contents">
          <div class="grid-with-lines-cell campaign">{{character.campaign}}</div>
          <div class="grid-with-lines-cell name">{{character.name}}</div>
          <div class="grid-with-lines-cell open">
            <edit-button :onClick="() => selectCharacter(viewedUser, character)">Open</edit-button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="viewing !== null && viewing.publicViewedUsers.length > 0"  class="buttons">
      <edit-button v-if="this.$globals.developerMode" :onClick="notImplemented">Add User</edit-button>
      <edit-button v-if="this.$globals.developerMode" :onClick="notImplemented">Delete User</edit-button>
    </div>
  </div>
</template>

<script>
  import {NotLoggedInError, getViewing, listPublicCharacters} from "../js/api.js";

  export default {
    name: "CharacterPickerViewing",
    props: {
      user: { type: String, required: true },
    },
    data: function() {
      return {
        viewing: null,
        publicCharacters: {},
      }
    },
    created: async function() {
      await this.loadViewing();
    },
    methods: {
      loadViewing: async function() {
        try {
          this.viewing = null;
          this.publicCharacters = {};
          this.viewing = await getViewing(this.user);
          await Promise.allSettled(this.viewing.publicViewedUsers.map(this.loadCharactersForUser));
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            // FIXME: Need to display the error to the user
            console.log("Failed to retrieve viewing users", err);
            throw err;
          }
        }
      },
      loadCharactersForUser: async function(viewedUser) {
        const response = await listPublicCharacters(viewedUser); // Retrieve characters (or can throw exception instead)
        this.$set(this.publicCharacters, viewedUser, response.characters);
      },
      selectCharacter: function(owningUser, character) {
        const eventData = {
          characterId: this.idFromKey(character.key),
          name: character.name,
          owningUser: owningUser,
        };
        this.$emit("change-character", eventData);
      },
      idFromKey: function(key) {
        return key.match("mutants/users/[^/]+/characters/(.*)\.json")[1];
      },
      notImplemented: function() {
        alert("Under Development");
      }
    }
  }
</script>

<style scoped>
  .character-picker-viewing > * {
    background-color: var(--paper-color);
  }
  .viewing {
    grid-template-columns: max-content max-content max-content;
  }
  .user-divider {
    grid-column-end: span 3;
    background-color: var(--grid-line-color);
    height: 3px;
  }
  .userHeading {
    grid-column-end: span 3;
    text-align: center;
    padding: 2px;
    border: 1px solid var(--grid-line-color);
    font-weight: bold;
  }
  .campaign {
    padding: 2px;
    text-align: center;
  }
  .name {
    padding: 2px;
    text-align: center;
  }
  .open {
    padding: 2px;
    text-align: center;
  }
  .buttons {
    margin-top: 5px;
    background-color: inherit;
  }
  .no-data {
    border: 1px solid var(--grid-line-color);
    padding: 2px;
    text-align: center;
  }
</style>
