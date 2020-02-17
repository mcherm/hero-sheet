<template>
  <BoxedSection title="Select Character" class="character-picker">
    <table class="character-list">
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Name</th>
          <th>Id</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="character in characters">
          <td>{{character.campaign}}</td>
          <td>{{character.name}}</td>
          <td>{{idFromKey(character.key)}}</td>
          <td><button v-on:click="selectCharacter(character)">Select</button></td>
        </tr>
      </tbody>
    </table>
    <button v-on:click="createNewCharacter()" class="new-character-button">New Character</button>
  </BoxedSection>
</template>

<script>
  import {newBlankCharacter} from "../js/heroSheetUtil.js";

  export default {
    name: "CharacterPicker",
    props: {
      user: { type: String, required: true },
      characterId: { type: String, required: true }
    },
    data: function() {
      return {
        characters: [],
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
</style>