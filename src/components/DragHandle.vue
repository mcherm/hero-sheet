<template>
  <div
      class="drag-handle"
      draggable="true"
      title="Drag Handle for Reorderering"
      @dragstart="dragStart($event)"
      @dragover="dragOver($event)"
      @drop="dragDrop($event)"
  />
</template>

<script>
  export default {
    name: "DragHandle",
    props: {
      draggableListName: { type: String, required: true },
      itemIndex: { type: Number, required: true },
      items: { type: Array, required: true },
    },
    computed: {
      mimeType: function() {
        return `application/x-hero-sheet.${this.draggableListName}`;
      },
    },
    methods: {
      dragStart: function(event) {
        event.dataTransfer.setData(this.mimeType, this.itemIndex.toString());
        event.dataTransfer.effectAllowed = "move";
      },
      dragOver: function(event) {
        if (event.dataTransfer.types.includes(this.mimeType)) {
          event.preventDefault();
        }
      },
      dragDrop: function(event) {
        const startingIndex = Number(event.dataTransfer.getData(this.mimeType));
        const endingIndex = this.itemIndex;
        const value = this.items[startingIndex];
        this.items.splice(startingIndex, 1);
        this.items.splice(endingIndex, 0, value);
      },
    }
  }
</script>

<style scoped>
  .drag-handle {
    min-width: 2em;
    background-image:
        radial-gradient(var(--grid-line-color) 25%, transparent 25%),
        radial-gradient(var(--grid-line-color) 25%, transparent 25%);
    background-color: var(--disabled-button-color);
    background-position: 0 0, 4px 4px;
    background-size: 8px 8px;
    border-radius: 6px;
    margin: 3px 2px;
  }
</style>
