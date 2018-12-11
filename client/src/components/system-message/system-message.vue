<template>
<transition name="slide-fade-top">
  <div :class="['message', classes]" v-if="text">
    <button class="close" @click="closeMessage">×</button>
    {{ text }}
  </div>
</transition>
</template>

<style scoped lang="scss" src="./system-message.scss"></style>

<script lang="ts" src="./system-message.ts">
</script>
