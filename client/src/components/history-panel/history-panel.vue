<template>
<transition name="slide-fade-left">
  <div class="history-panel" v-if="isVisible">
    <div class="bold title">
      History
      <i class="fas fa-angle-double-up" v-if="redoStack.length > 5"></i>
    </div>
    <hr class="divider">
    <div class="events" ref="events">
      <div class="redo-group">
        <div v-for="(evt, index) in redoStack.slice(-5)" :key="index" class="event redo"
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
        <div v-for="(evt, index) in undoStack.concat().reverse()" :key="index" class="event undo"
          @click="undoEvents(index)">
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
