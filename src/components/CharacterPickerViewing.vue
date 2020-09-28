<!--
  Loads and renders the list of characters belonging to other users that the
  current user is set up to view. Also allows the user to pick one of these
  to view.
-->
<template>
  <div class="character-picker-viewing">
    <div v-if="viewing === null" class="placeholder">Loading...</div>
    <div v-if="viewing !== null && viewing.publicViewedUsers.length === 0" class="placeholder">Not viewing any public characters</div>
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
    <div v-if="viewing !== null"  class="buttons">
      <edit-button :onClick="() => showingViewedUserPicker = true">Choose Users</edit-button>
    </div>
    <modal-lightbox
        v-if="showingViewedUserPicker"
        :button-names="['Cancel', 'Done']"
        v-on:exit="exitPickViewedUsers($event)">
      <viewed-user-picker :user="user" :viewed-users-map="viewedUsersMapBeingEdited"/>
    </modal-lightbox>
  </div>
</template>

<script>
  import {NotLoggedInError, getViewing, putViewing, listPublicCharacters} from "../js/api.js";
  import ViewedUserPicker from "@/components/ViewedUserPicker.vue";

  export default {
    name: "CharacterPickerViewing",
    components: {
      ViewedUserPicker
    },
    props: {
      user: { type: String, required: true },
    },
    data: function() {
      return {
        viewing: null,
        viewedUsersMapBeingEdited: null,
        publicCharacters: {},
        showingViewedUserPicker: false,
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
          this.resetMapBeingEdited();
          await this.loadCharactersForAllUsers();
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
      loadCharactersForAllUsers: async function() {
        await Promise.allSettled(this.viewing.publicViewedUsers.map(this.loadCharactersForUser));
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
      resetMapBeingEdited: function() {
        this.viewedUsersMapBeingEdited = Object.fromEntries(
            this.viewing.publicViewedUsers.map(x => [x,true])
        );
      },
      exitPickViewedUsers: async function(buttonClicked) {
        this.showingViewedUserPicker = false;
        if (buttonClicked === "Done") {
          const publicViewedUsers = [];
          for (const name in this.viewedUsersMapBeingEdited) {
            if (this.viewedUsersMapBeingEdited[name]) {
              publicViewedUsers.push(name);
            }
          }
          const viewing = { publicViewedUsers };
          const update = await putViewing(this.user, viewing); // FIXME: Should check for errors and report
          this.viewing = viewing;
          this.resetMapBeingEdited();
          await this.loadCharactersForAllUsers();
        } else {
          // The user cancelled the modal, so just reset the map.
          this.resetMapBeingEdited();
        }
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
  .placeholder {
    padding: 2px;
    border: 2px solid var(--grid-line-color);
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
