<template>
<div :class="['port', { active: isActive }]"
  @mousedown="mousedown"
  @dblclick.prevent.stop="activate"
  v-global-click="globalClick">
  <transition name="slide-fade-right">
    <port-panel ref="portPanel" v-if="isActive">
      Panel for port {{ id }}
      <div>
        <a @click="clickLink">test link</a>
      </div>
    </port-panel>
  </transition>
</div>
</template>

<style src="./port.scss"></style>

<script src="./port.ts">
</script>
