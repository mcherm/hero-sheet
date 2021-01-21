<template>
  <div>
    <logo-section/>
    <alert-bar :alert-list="alertList"/>
    <header-section
        title-if-logged-out="Log In"
        :character-name="characterName"
        :character-selected="characterSelected"
        :user="user"
        :user-selected="userSelected"
        :can-change-edit-mode="owningUser === null"
        :edit-mode="editMode"
        @set-edit-mode="setEditMode($event)"
        @close-character="closeCharacter()"
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
        :editMode="editMode"
        v-on:change-character-name="characterName = $event"
        v-on:not-logged-in="resetUser()"
        v-on:change-character="changeCharacter($event)"
    />
  </div>
</template>

<script>
  import CharacterPicker from "@/components/CharacterPicker.vue";
  import CharacterContainer from "@/components/CharacterContainer.vue";
  import UserLogin from "@/components/UserLogin.vue";
  import LogoSection from "@/components/LogoSection.vue";
  import HeaderSection from "@/components/HeaderSection.vue";
  import AlertBar from "@/components/AlertBar.vue";

  import {endSession, restoreSession} from "@/js/api.js";

  const originRegex = "https?://[^/]+";
  const userRegex = "[a-zA-Z0-9$@._+-]+";
  const editModeRegex = "[DPR]";
  const characterIdRegex = "CH[A-Z0-9]+";
  const urlParsingRegex = new RegExp(
      `^(${originRegex})(?:/u/(${userRegex})(?:/(${editModeRegex})/(${characterIdRegex}))?)?$`
  );

  export default {
    name: "EntirePage",
    components: {
      LogoSection,
      AlertBar,
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
        owningUser: null, // when characterSelected, this is the user name of the owner or null if owned by the current user
        characterName: "",
        editMode: "DESIGNING",
        alertList: [],
      }
    },
    created: async function() {
      // --- Capture starting URL before we change it ---
      const startingURL = document.location.toString();

      // --- Begin listening for "back button" ---
      window.addEventListener('popstate', event => {
        const newURL = document.location;
        this.renderSpecifiedURL(newURL, false);
      });

      // --- Begin processing alerts ---
      this.$globals.eventBus.$on("show-alert", this.showAlert);
      this.$globals.eventBus.$on("clear-alert", this.clearAlert);

      // --- Restore session (logged-in user) ---
      try {
        const restoreSessionResponse = await restoreSession();
        if (restoreSessionResponse.isValid) {
          this.setUser(restoreSessionResponse.user, false);
        } else {
          // Not valid, but we can still use the user to prefill the login screen
          console.log("Existing session not valid; will request a login.");
          this.user = restoreSessionResponse.user || "";
        }
      } catch(err) {
        console.log(`The attempt to restore session failed`, err);
        // The attempt to restore session failed; proceed without a live session
      }

      // --- Navigate to intended URL (if logged in) ---
      if (this.userSelected) {
        this.renderSpecifiedURL(startingURL, false);
      }
    },
    methods: {
      showAlert: function(alert) {
        this.alertList.push(alert);
        if (alert.lifetime === "short" || alert.lifetime === "long") {
          const millisToShow = alert.lifetime === "short" ? 3500 : 15000;
          setTimeout(this.clearAlert, millisToShow, alert.hsid);
        }
      },
      clearAlert: function(alertHsid) {
        this.alertList = this.alertList.filter(x => x.hsid !== alertHsid);
      },
      setUser: function(newUser, reversibleWithBackButton = true) {
        this.user = newUser;
        this.userSelected = true;
        this.updateBrowserHistory(reversibleWithBackButton);
      },
      changeCharacter: function(newCharacter, editMode = null, reversibleWithBackButton = true) {
        this.characterSelected = false;
        const actualEditMode = (this.owningUser === null
            ? "READ_ONLY"
            : editMode || "DESIGNING"
        );
        this.$nextTick(() => {
          this.characterId = newCharacter.characterId;
          this.characterName = newCharacter.name;
          this.owningUser = newCharacter.owningUser;
          this.characterSelected = true;
          this.editMode = actualEditMode;
          this.updateBrowserHistory(reversibleWithBackButton);
        });
      },
      setEditMode: function(newEditMode, reversibleWithBackButton = false) {
        this.editMode = newEditMode;
        this.updateBrowserHistory(reversibleWithBackButton);
      },
      resetUser: async function(reversibleWithBackButton = false) {
        await endSession();
        this.userSelected = false;
        this.characterSelected = false;
        this.characterId = "";
        this.characterName = "";
        this.updateBrowserHistory(reversibleWithBackButton);
      },
      closeCharacter: function(reversibleWithBackButton = true) {
        this.characterSelected = false;
        this.characterId = "";
        this.characterName = "";
        this.updateBrowserHistory(reversibleWithBackButton);
      },
      updateBrowserHistory: function(reversibleWithBackButton) {
        const historyAction = reversibleWithBackButton ?  "pushState" : "replaceState";
        const origin = location.origin;
        let path;
        if (this.characterSelected) {
          const user = this.owningUser === null ? this.user : this.owningUser;
          const editModeCode = this.editMode.charAt(0);
          const characterId = this.characterId;
          path = `${origin}/u/${user}/${editModeCode}/${characterId}`;
        } else if (this.userSelected) {
          const user = this.user;
          path = `${origin}/u/${user}`;
        } else {
          path = `${origin}`;
        }
        history[historyAction]("", "", path);
      },
      renderSpecifiedURL: function(url, reversibleWithBackButton = true) {
        const match = urlParsingRegex.exec(url);
        if (match) {
          const [wholeURL, origin, user, editModeCode, characterId] = match;
          if (editModeCode === undefined || characterId === undefined) {
            // --- Navigate to home page for this user ---
            if (this.characterSelected) {
              this.closeCharacter(reversibleWithBackButton);
            }
          } else {
            // --- Navigate to a character ---
            if (this.characterSelected) {
              this.closeCharacter(true, false);
            }
            const owningUser = this.user === user ? null : user;
            const newCharacter = {
              characterId,
              owningUser,
            };
            const editMode = {
              D: "DESIGNING",
              P: "PLAYING",
              R: "READ_ONLY",
            }[editModeCode];
            this.changeCharacter(newCharacter, editMode, reversibleWithBackButton);
          }
        } else {
          // Just don't navigate anywhere
          console.log(`URL "${url}" was malformed`);
        }
      },
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
