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
  import HeaderSection from "@/components/HeaderSection";
  import {fieldAllowedRegEx} from "@/js/heroSheetUtil.js";

  // Create a global "$globals" available on all vue instances. (NOT reactive).
  const globals = {
    eventBus: new Vue({}),
    developerMode: false,
    deployment: "prod",
  };
  Vue.prototype.$globals = globals;

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
      changePassword: function() {
        console.log(`I will now change the password to '${this.newPassword}'. The user is '${this.userOrEmail}' and the authToken is '${this.authToken}'.`); // FIXME: Write real code
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
