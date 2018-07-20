<template>
<div v-if="id" :style="gradient" class="gradient"></div>
</template>

<style scoped lang="scss">
.gradient {
  border-radius: 2px;
  box-shadow: 1px 1px 1px #888;
  height: 15px;
}
</style>

<script lang="ts" src="./color-scale-display.ts">
</script>
