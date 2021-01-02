<template>
  <div>
    <boxed-section title="Pick the Users to Subscribe To">
      <p class="descriptive-text">The list below shows (at least some of) the users who have marked characters as being public.</p>
      <div v-if="publicUsers === null" class="placeholder">Loading...</div>
      <div v-else class="grid-with-lines public-users">
        <div class="col-label">User</div>
        <div class="col-label"># Characters</div>
        <div class="col-label">Subscribe</div>
        <div v-for="publicUser of publicUsers" :key="publicUser.user"  class="display-contents">
          <div class="user">{{publicUser.user}}</div>
          <div class="count">{{publicUser.publicCharacters}}</div>
          <div class="checkit">
            <edit-checkbox
                :value="Boolean(viewedUsersMap[publicUser.user])"
                @input="$set(viewedUsersMap, publicUser.user, !viewedUsersMap[publicUser.user])"
            />
          </div>
        </div>
      </div>
    </boxed-section>
  </div>
</template>

<script>
  import {getViewableUsers} from "@/js/api.js";

  export default {
    name: "ViewedUserPicker",
    props: {
      user: { type: String, required: true },
      viewedUsersMap: { type: Object, required: true }, // keys are user names; values are true, false, or undefined; the picker MODIFIES this as it works.
    },
    data: function() {
      return {
        publicUsers: null,
      };
    },
    created: async function() {
      const viewableUsers = await getViewableUsers(this.user);
      this.publicUsers = viewableUsers.publicUsers;
      await this.dropViewedUsersWithNoPublicCharacters()
    },
    methods: {
      // A user might remove all of their public characters. If we notice this has
      // happened to a user we are viewing, we should stop viewing that user
      dropViewedUsersWithNoPublicCharacters: async function() {
        const setOfPublicUserNames = Object.fromEntries(this.publicUsers.map(x => [x.user, true]));
        for (const viewedUser in this.viewedUsersMap) {
          if (!setOfPublicUserNames[viewedUser]) {
            this.viewedUsersMap[viewedUser] = false;
          }
        }
      }
    },
  }
</script>

<style scoped>
  .boxed-section > .descriptive-text {
    background-color: var(--section-color);
  }
  .public-users {
    grid-template-columns: max-content max-content max-content;
    display: grid inline;
  }
  .user {
    padding: 2px;
  }
  .count {
    padding: 2px;
  }
  .checkit {
    padding: 2px;
  }
</style>
