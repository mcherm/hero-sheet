<template>
  <div class="character-picker-own-characters">
    <div v-if="characters === null" class="placeholder">Loading...</div>
    <table v-if="characters !== null" class="character-list">
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Name</th>
          <th>Public</th>
          <th v-if="$globals.developerMode">Id</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="characters.length === 0"><td colspan="4">No Characters</td></tr>
        <tr v-for="character in characters">
          <td>{{character.campaign}}</td>
          <td>{{character.name}}</td>
          <td>{{character.isPublic ? "Yes" : "No"}}</td>
          <td  v-if="$globals.developerMode">{{idFromKey(character.key)}}</td>
          <td>
            <edit-button v-if="isDeleting" :onClick="() => deleteCharacter(character)" class="trash-button"><trash-icon/></edit-button>
            <edit-button v-if="!isDeleting" :onClick="() => selectCharacter(character)">Open</edit-button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="characters !== null" class="buttons">
      <edit-button v-if="characters !== null && !isDeleting" :onClick="createNewCharacter" class="new-character-button">New Character</edit-button>
      <edit-button v-if="characters !== null && !isDeleting" :onClick="() => isDeleting=true">Delete</edit-button>
      <edit-button v-if="characters !== null && isDeleting" :onClick="() => isDeleting=false">Done Deleting</edit-button>
      <edit-button v-if="this.$globals.developerMode" :onClick="loadCharacterData">Reload</edit-button>
      <edit-button v-if="this.$globals.developerMode" :onClick="rebuildIndex">Rebuild Index</edit-button>
    </div>
  </div>
</template>

<script>
  import {createCharacter, deleteCharacter, listCharacters, NotLoggedInError, rebuildIndex} from "../js/api.js";
  import {newBlankCharacter} from "../js/heroSheetVersioning.js";

  export default {
    name: "CharacterPickerOwnCharacters",
    props: {
      user: { type: String, required: true },
    },
    data: function() {
      return {
        characters: null,
        isDeleting: false,
      }
    },
    created: function() {
      this.loadCharacterData();
    },
    methods: {
      loadCharacterData: async function() {
        try {
          const response = await listCharacters(this.user);
          const characterList = response.characters;
          // FIXME: Move the sorting onto the server side!
          characterList.sort((a,b) => {
            const campaignDelta = a.campaign.localeCompare(b.campaign);
            return campaignDelta ? campaignDelta : a.name.localeCompare(b.name);
          });
          this.characters = characterList;
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            // FIXME: Need to display the error to the user
            console.log("Failed to list characters", err);
            throw err;
          }
        }
      },
      idFromKey: function(key) {
        return key.match("mutants/users/[^/]+/characters/(.*)\.json")[1];
      },
      selectCharacter: function(character) {
        const eventData = {
          characterId: character.characterId || this.idFromKey(character.key),
          name: character.name,
          owningUser: null,
        };
        this.$emit("change-character", eventData);
      },
      createNewCharacter: async function() {
        const character = newBlankCharacter(this.$globals.developerMode);
        try {
          const createResponse = await createCharacter(this.user, character);
          this.selectCharacter({
            characterId: createResponse.characterId,
            name: ""
          });
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            // FIXME: Need to display the error to the user
            console.log("Failed to create character", err);
          }
        }
      },
      deleteCharacter: async function(character) {
        this.$delete(this.characters, this.characters.indexOf(character));
        const characterId = this.idFromKey(character.key);
        try {
          await deleteCharacter(this.user, characterId);
        } catch(err) {
          if (err instanceof NotLoggedInError) {
            this.$emit("not-logged-in");
          } else {
            // FIXME: Need to display the error to the user
            console.log(`Failed to delete character ${characterId}`);
          }
        }
      },
      rebuildIndex: async function() {
        await rebuildIndex(this.user);
        await this.loadCharacterData();
      },
    },
  }
</script>

<style scoped>
  .character-picker-own-characters > * {
    background-color: var(--paper-color);
  }
  th {
    border: 2px solid var(--grid-line-color);
    text-align: center;
    padding: 2px;
  }
  td {
    border: 2px solid var(--grid-line-color);
    text-align: center;
    padding: 2px;
  }
  .placeholder {
    border: 2px solid var(--grid-line-color);
    padding: 4px;
    display: table;
  }
  .buttons {
    margin-top: 5px;
    background-color: inherit;
  }
  .trash-button {
    background-color: var(--paper-color);
    padding: 0;
    border: none;
    margin: 0;
  }
</style>
