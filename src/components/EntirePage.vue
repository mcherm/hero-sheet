<template>
  <div>
    <div class="header">
      <div class="title">Hero Sheet<span v-if="characterSelected && characterName !== ''"> : {{characterName}}</span></div>
      <button v-if="characterSelected" v-on:click="resetCharacter()" class="character-display">{{characterName}}</button>
      <button v-if="userSelected" v-on:click="resetUser()" class="user-display">{{user}}</button>
    </div>
    <user-picker
        v-if="!userSelected"
        :user="user"
        v-on:change-user="setUser($event)"
    />
    <character-picker
        v-if="userSelected && !characterSelected"
        :user="user"
        :characterId="characterId"
        v-on:change-character="setCharacterId($event)"
    />
    <character-sheet
        v-if="userSelected && characterSelected"
        :user="user"
        :characterId="characterId"
        v-on:change-character-name="characterName = $event"
    />
  </div>
</template>

<script>
  import UserPicker from "./UserPicker.vue";
  import CharacterPicker from "./CharacterPicker.vue";
  import CharacterSheet from "./CharacterSheet.vue";

  export default {
    name: "EntirePage",
    components: {
      UserPicker,
      CharacterPicker,
      CharacterSheet
    },
    data: function() {
      return {
        userSelected: false,
        user: "",
        characterSelected: false,
        characterId: "",
        characterName: ""
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
  .user-display {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 2px;
  }
  .character-display {
    border: solid 1px var(--box-border-color);
    padding: 2px;
    margin: 2px;
  }
  .title {
    text-align: center;
    flex-grow: 1;
    font-size: x-large;
  }
</style>