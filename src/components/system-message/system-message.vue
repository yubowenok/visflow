<template>
<transition name="slide-fade-top">
  <div :class="['message', classes]" v-if="text">
    <button class="btn close" @click="closeMessage">
      <i class="fas fa-xs fa-times"></i>
    </button>
    {{ text }}
  </div>
</transition>
</template>

<style scoped src="./system-message.scss"></style>

<script src="./system-message.ts">
</script>
