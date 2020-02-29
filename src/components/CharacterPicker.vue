<template>
  <BoxedSection title="Select Character" class="character-picker">
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
          <div v-if="isDeleting" v-on:click="deleteCharacter(character)"><TrashIcon/></div>
          <button v-if="!isDeleting" v-on:click="selectCharacter(character)">Open</button>
        </td>
      </tr>
      </tbody>
    </table>
    <button v-if="characters !== null && !isDeleting" v-on:click="createNewCharacter()" class="new-character-button">New Character</button>
    <button v-if="characters !== null && !isDeleting" v-on:click="isDeleting=true">Delete</button>
    <button v-if="characters !== null && isDeleting" v-on:click="isDeleting=false">Done Deleting</button>
  </BoxedSection>
</template>

<script>
  import {newBlankCharacter} from "../js/heroSheetUtil.js";
  import TrashIcon from "./TrashIcon";

  export default {
    name: "CharacterPicker",
    components: {
      TrashIcon
    },
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
      const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters`;
      const response = await fetch(url);
      const json = await response.json();
      this.characters = json.characters;
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
        const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters`;
        const response = await fetch(url, {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(character)
        });
        if (response.status === 200) {
          const json = await response.json();
          this.selectCharacter({
            characterId: json.characterId,
            name: ""
          });
        } else {
          // FIXME: Need to display the error to the user
          console.log("Failed to create character", response);
        }
      },
      deleteCharacter: async function(character) {
        this.$delete(this.characters, this.characters.indexOf(character));
        const characterId = this.idFromKey(character.key);
        const url = `https://u3qr0bfjmc.execute-api.us-east-1.amazonaws.com/prod/hero-sheet/users/${this.user}/characters/${characterId}`;
        const response = await fetch(url, {
          method: "DELETE",
          mode: "cors"
        });
        if (response.status !== 200) {
          // FIXME: Need to display the error to the user
          console.log("Failed to delete character", JSON.stringify(response));
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
</style>