<!--
  Enter a single integer value.
-->
<template>
  <textarea
    v-bind:value="value"
    v-on:input="resize()"
    v-on:change="$emit('input', $event.target.value)"
    class="string-entry"
    :disabled="!isReallyMutable"
    rows="1"
  ></textarea>
</template>

<script>
  export default {
    name: "StringEntry",
    inject: ["editModes"],
    props: {
      value: { type: String, required: true },
      mutable: { type: Boolean, required: false, default: true }
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
      isReallyMutable: function() {
        const globalReadOnly = this.editModes && ("isReadOnly" in this.editModes) && this.editModes.isReadOnly;
        return this.mutable && !globalReadOnly;
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
  .string-entry:disabled {
    background-color: inherit;
  }
</style>
