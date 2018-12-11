<template>
<div class="bar">
  <b-button id="undo" size="sm" variant="outline-secondary" @click="undoEvents(1)"
    :disabled="!undoMessage"
    @mousedown="hideTooltip"
    @mouseleave="hideTooltip"
  ><i class="fas fa-undo-alt"></i></b-button>
  <b-button id="redo" size="sm" variant="outline-secondary" @click="redoEvents(1)"
    :disabled="!redoMessage"
    @mousedown="hideTooltip"
    @mouseleave="hideTooltip"
  ><i class="fas fa-redo-alt"></i></b-button>
  <b-tooltip :show.sync="isUndoTooltipVisible" target="undo" delay="500">
    Undo <span class="shortcut">{{osCtrlKeyChar}}Z</span>
  </b-tooltip>
  <b-tooltip :show.sync="isRedoTooltipVisible" target="redo" delay="500">
    Redo <span class="shortcut">{{osCtrlKeyChar}}⇧Z</span>
  </b-tooltip>
</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

.bar > * {
  margin: 0 $margin-size-sm;
}
</style>

<script lang="ts" src="./history-bar.ts">
</script>
