<!--
  Enter a single integer value.
-->
<template>
  <textarea
    v-bind:value="value"
    v-on:input="resize()"
    v-on:change="$emit('input', $event.target.value)"
    class="string-entry"
    :class="{'used-in-play': usedInPlay}"
    :disabled="isDisabled"
    :readonly="isReadOnly"
    rows="1"
  ></textarea>
</template>

<script>
  export default {
    name: "StringEntry",
    inject: ["editModes"],
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true },
      usedInPlay: { type: Boolean, requried: false, default: false },
    },
    data: function() {
      return {
        offset: 0
      };
    },
    mounted: function() {
      // NOTE: The -2 avoids extra padding at the bottom, although I don't know exactly why
      this.offset = this.$el.offsetHeight - this.$el.clientHeight - 2;
      this.resize();
    },
    computed: {
      isDisabled: function() {
        return !this.mutable;
      },
      isReadOnly: function() {
        const globalReadOnly = this.editModes && (
            this.editModes.editMode === "READ_ONLY" ||
            this.editModes.editMode === "PLAYING" && !this.usedInPlay
        );
        return globalReadOnly;
      }
    },
    methods: {
      resize: function() {
        this.$el.style.height = "auto";
        this.$el.style.height = (this.$el.scrollHeight + this.offset) + "px";
      }
    }
  }
</script>

<style scoped>
  .string-entry {
    background-color: var(--entry-field);
    font-size: inherit;
    font-family: inherit;
    resize: none;
    margin-top: 0;
    margin-bottom: 0;
  }
  .string-entry.used-in-play {
    background-color: var(--in-play-entry-field);
  }
  .string-entry:disabled {
    background-color: var(--paper-color);
  }
  .string-entry:read-only {
    background-color: var(--paper-color);
  }
</style>
