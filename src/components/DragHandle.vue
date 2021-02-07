<template>
  <div class="table-cell">
    <div
        class="drag-handle"
        :class="{'can-drop-here-now': canDropHereNow, 'am-dragging-this-now': amDraggingThisNow}"
        draggable="true"
        title="Drag Handle for Reorderering"
        @dragstart="dragStart($event)"
        @dragenter="dragEnter($event)"
        @dragexit="dragExit($event)"
        @dragover="dragOver($event)"
        @drop="dragDrop($event)"
        @dragend="dragEnd($event)"
    >
      <svg height="6" width="25">
        <polygon points="0,6 12.5,1 25,6" class="arrowhead"/>
      </svg>
      <div class="arrowbody"/>
      <svg height="6" width="25">
        <polygon points=" 0,0 25,0 12.5,5" class="arrowhead"/>
      </svg>
    </div>
  </div>
</template>

<script>
  export default {
    name: "DragHandle",
    props: {
      draggableListName: { type: String, required: true },
      itemIndex: { type: Number, required: true },
      items: { type: Array, required: true },
    },
    data: function() {
      return {
        amDraggingThisNow: false,
        canDropHereNow: false,
      };
    },
    computed: {
      mimeType: function() {
        return `application/x-hero-sheet.${this.draggableListName.toLowerCase()}`;
      },
    },
    methods: {
      /* Given an event, return the index the dragged item started on. */
      getStartingIndex: function(event) {
        return Number(event.dataTransfer.getData(this.mimeType));
      },
      dragStart: function(event) {
        event.dataTransfer.setData(this.mimeType, this.itemIndex.toString());
        event.dataTransfer.effectAllowed = "move";
        this.amDraggingThisNow = true;
      },
      dragEnter: function(event) {
        if (this.itemIndex !== this.getStartingIndex(event)) {
          if (event.dataTransfer.types.includes(this.mimeType)) {
            this.canDropHereNow = true;
            event.preventDefault();
          }
        }
      },
      dragExit: function(event) {
        this.canDropHereNow = false;
      },
      dragOver: function(event) {
        if (event.dataTransfer.types.includes(this.mimeType)) {
          event.preventDefault();
        }
      },
      dragDrop: function(event) {
        const startingIndex = this.getStartingIndex(event);
        const endingIndex = this.itemIndex;
        const value = this.items[startingIndex];
        this.items.splice(startingIndex, 1);
        this.items.splice(endingIndex, 0, value);
        this.canDropHereNow = false;
      },
      dragEnd: function(event) {
        this.amDraggingThisNow = false;
      }
    }
  }
</script>

<style scoped>
  .table-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .drag-handle {
    flex-grow: 1;
    min-width: 25px;
    margin: 3px 2px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
  .drag-handle.can-drop-here-now {
    background-color: orange;
  }
  .drag-handle.am-dragging-this-now {
    background-color: lightskyblue;
  }
  .arrowhead {
    fill: var(--disabled-button-color);
    stroke-width: 1;
    stroke: var(--grid-line-color);
  }
  .arrowbody {
    flex-grow: 1;
    min-width: 15px;
    background-image:
        radial-gradient(var(--grid-line-color) 25%, transparent 25%),
        radial-gradient(var(--grid-line-color) 25%, transparent 25%);
    background-color: var(--disabled-button-color);
    background-position: 0 0, 4px 4px;
    background-size: 8px 8px;
    border-left: 1px solid var(--grid-line-color);
    border-right: 1px solid var(--grid-line-color);
  }
</style>
