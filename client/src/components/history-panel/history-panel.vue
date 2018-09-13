<template>
<transition name="slide-fade-left">
  <div class="history-panel" v-if="isVisible">
    <div class="bold title">
      History
      <span class="buttons">
        <b-button size="sm" variant="outline-secondary" @click="undoEvents(1)"
          :disabled="!undoMessage"><i class="fas fa-undo-alt"></i></b-button>
        <b-button size="sm" variant="outline-secondary" @click="redoEvents(1)"
          :disabled="!redoMessage"><i class="fas fa-redo-alt"></i></b-button>
      </span>
      <i id="more-redo" class="fas fa-angle-double-up" v-show="redoStack.length > 5"></i>
      <b-tooltip target="more-redo">more redo's above</b-tooltip>
    </div>
    <hr class="divider">
    <div class="history-events" ref="events">
      <div class="redo-group">
        <div v-for="(evt, index) in redoStack.slice(-5)" :key="index" class="history-event redo"
          @click="redoEvents(Math.min(5, redoStack.length) - index)">
          <span class="icon" v-if="evt.icon">
            <img class="node-icon" :src="getIconPath(evt.icon.nodeType)" v-if="evt.icon.isNodeIcon">
            <i :class="evt.icon.value" v-else></i>
          </span>
          <span v-else class="icon"></span>
          <span>{{ evt.message }}</span>
        </div>
      </div>
      <div class="undo-group">
        <div v-for="(evt, index) in undoStack.concat().reverse()" :key="index" class="history-event undo"
          @click="undoEvents(Math.max(index, 1))">
          <span class="icon" v-if="evt.icon">
            <img class="node-icon" :src="getIconPath(evt.icon.nodeType)" v-if="evt.icon.isNodeIcon">
            <i :class="evt.icon.value" v-else></i>
          </span>
          <span v-else class="icon"></span>
          <span>{{ evt.message }}</span>
        </div>
      </div>
    </div>
  </div>
</transition>
</template>

<style scoped lang="scss" src="./history-panel.scss"></style>

<script lang="ts" src="./history-panel.ts">
</script>
