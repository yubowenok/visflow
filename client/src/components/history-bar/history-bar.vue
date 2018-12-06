<template>
<div class="bar">
  <b-button id="undo" size="sm" variant="outline-secondary" @click="undoEvents(1)"
    :disabled="!undoMessage"><i class="fas fa-undo-alt"></i></b-button>
  <b-button id="redo" size="sm" variant="outline-secondary" @click="redoEvents(1)"
    :disabled="!redoMessage"><i class="fas fa-redo-alt"></i></b-button>
  <b-tooltip target="undo" delay="1000">
    Undo <span class="shortcut">{{osCtrlKeyChar}}Z</span>
  </b-tooltip>
  <b-tooltip target="redo" delay="1000">
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
