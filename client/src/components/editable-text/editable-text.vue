<template>
<div @click="onClick">
  <span ref="text" @keydown.enter.prevent="onEnter">{{ text }}</span>
  <i class="fas fa-pen" v-if="useEditButton" @click="makeEditable"></i>
  <i class="fas fa-pencil"></i>
</div>
</template>

<style scoped lang="scss" src="./editable-text.scss"></style>

<script lang="ts" src="./editable-text.ts">
</script>
