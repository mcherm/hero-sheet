<template>
  <boxed-section title="Select Character" class="character-picker">
    <div v-if="characters === null" class="placeholder">Loading...</div>
    <table v-if="characters !== null" class="character-list">
      <thead>
      <tr>
        <th>Campaign</th>
        <th>Name</th>
        <th>Id</th>
        <th></th>
      </tr>
      </thead>
      <tbody>
      <tr v-if="characters.length === 0"><td colspan="4">No Characters</td></tr>
      <tr v-for="character in characters">
        <td>{{character.campaign}}</td>
        <td>{{character.name}}</td>
        <td>{{idFromKey(character.key)}}</td>
        <td>
          <div v-if="isDeleting" v-on:click="deleteCharacter(character)"><trash-icon/></div>
          <button v-if="!isDeleting" v-on:click="selectCharacter(character)">Open</button>
        </td>
      </tr>
      </tbody>
    </table>
    <div class="buttons">
      <button v-if="characters !== null && !isDeleting" v-on:click="createNewCharacter()" class="new-character-button">New Character</button>
      <button v-if="characters !== null && !isDeleting" v-on:click="isDeleting=true">Delete</button>
      <button v-if="characters !== null && isDeleting" v-on:click="isDeleting=false">Done Deleting</button>
    </div>
  </boxed-section>
</template>

<script>
  import {newBlankCharacter} from "../js/heroSheetVersioning.js";
  import {listCharacters, createCharacter, deleteCharacter} from "../js/api.js";

  export default {
    name: "CharacterPicker",
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true }
    },
    data: function() {
      return {
        characters: null,
        isDeleting: false
      }
    },
    created: async function() {
      const response = await listCharacters(this.user);
      const characterList = response.characters;
      // FIXME: Move the sorting onto the server side!
      characterList.sort((a,b) => {
        const campaignDelta = a.campaign.localeCompare(b.campaign);
        return campaignDelta ? campaignDelta : a.name.localeCompare(b.name);
      });
      this.characters = characterList;
    },
    methods: {
      idFromKey: function(key) {
        return key.match("mutants/users/[^/]+/characters/(.*)\.json")[1];
      },
      selectCharacter: function(character) {
        const eventData = {
          characterId: character.characterId || this.idFromKey(character.key),
          name: character.name
        };
        this.$emit("change-character", eventData);
      },
      createNewCharacter: async function() {
        const character = newBlankCharacter();
        try {
          const createResponse = await createCharacter(this.user, character);
          this.selectCharacter({
            characterId: createResponse.characterId,
            name: ""
          });
        } catch(err) {
          // FIXME: Need to display the error to the user
          console.log("Failed to create character", err);
        }
      },
      deleteCharacter: async function(character) {
        this.$delete(this.characters, this.characters.indexOf(character));
        const characterId = this.idFromKey(character.key);
        try {
          await deleteCharacter(this.user, characterId);
        } catch(err) {
          // FIXME: Need to display the error to the user
          console.log(`Failed to delete character ${characterId}`);
        }
      }
    }
  }
</script>

<style scoped>
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
  .character-picker .buttons {
    margin-top: 5px;
    background-color: inherit;
  }
</style>