<template>
<div class="log-panel" v-show="isVisible">
  <div class="bold title">
    Logs
    <span class="buttons">
      <b-button size="sm" variant="outline-secondary" @click="redoLog"
        :disabled="currentLogIndex >= logs.length - 1">
        <i class="fas fa-play"></i></b-button>
      <b-button size="sm" variant="outline-secondary" @click="loadDiagram">Diagram</b-button>
    </span>
  </div>
  <hr class="divider">
  <div class="logs">
    <div v-for="(log, index) in logs" :key="index"
      :class="['log', { current: index === currentLogIndex }]"
      @click="printLog(log)">
      <span>{{ `[${formatLogTime(log.timestamp)}]` }} </span>
      <span class="bold">{{ log.type }}</span>
      <span v-if="log.data && log.data.message" class="message">{{ log.data.message }}</span>
    </div>
  </div>
</div>
</template>

<style scoped lang="scss" src="./log-panel.scss"></style>

<script lang="ts" src="./log-panel.ts">
</script>
