<template>
  <div id="app">
    <logo-section/>
    <header-section
        title-if-logged-out="Reset Password"
        character-name=""
        :character-selected="false"
        user=""
        :user-selected="false"
    />
    <boxed-section title="Reset Password" class="password-reset-form">
      <label>Username or Email</label>
      <input v-model="userOrEmail" readonly/>
      <label>New Password</label>
      <input v-model="newPassword" @keyup.enter="changePassword()" :pattern="allowedRegEx.password"/>
      <button v-on:click="changePassword()" :disabled="!fieldsAreValid">Reset Password</button>
    </boxed-section>
  </div>
</template>

<script>
  import Vue from 'vue';
  import LogoSection from "@/components/LogoSection.vue";
  import HeaderSection from "@/components/HeaderSection.vue";
  import {fieldAllowedRegEx, showAlert, initializeGlobals} from "@/js/heroSheetUtil.js";
  import {resetPassword} from "@/js/api.js";

  // Create a global "$globals" available on all vue instances. (NOT reactive).
  Vue.prototype.$globals = initializeGlobals(location.hostname);

  const pageUrl = new URL(location.href);

  export default {
    name: "reset-password",
    components: {
      LogoSection,
      HeaderSection,
    },
    data: function() {
      return {
        allowedRegEx: fieldAllowedRegEx,
        userOrEmail: pageUrl.searchParams.get("user"),
        authToken: pageUrl.searchParams.get("auth"),
        newPassword: "",
      };
    },
    computed: {
      fieldsAreValid: function() {
        return Boolean(this.newPassword.match(fieldAllowedRegEx.password));
      }
    },
    methods: {
      changePassword: async function() {
        try {
          const resetPasswordResponse = await resetPassword(this.userOrEmail, this.authToken, this.newPassword);
          window.location.href = "/";
        } catch(err) {
          showAlert({message: "Failure when attempting to reset password.", lifetime: "long"});
        }
      }
    }
  }
</script>

<style>
  .password-reset-form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .boxed-section.password-reset-form label {
    background-color: var(--section-color);
  }
  .boxed-section label {
    background-color: inherit;
    margin-top: 3px;
    margin-left: 3px;
  }
  input {
    font-size: inherit;
    margin: 3px;
  }
  button {
    margin: 3px;
  }
</style>
