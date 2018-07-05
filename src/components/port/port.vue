<template>
<div>
  <div ref="port"
    :class="['port', { active: isActive }]"
    @mousedown="mousedown"
    @dblclick.prevent.stop="activate"
    @contextmenu.prevent.stop="openContextMenu"
    v-global-click="globalClick">
    <span class="connectivity" v-if="MAX_CONNECTIONS === 1">
      <i class="fas fa-circle"></i>
    </span>
    <transition name="slide-fade-right">
      <port-panel ref="portPanel" v-if="isActive" :port-id="id">
        <div>
          <a @click="clickLink">test link</a>
        </div>
      </port-panel>
    </transition>
  </div>
  <context-menu ref="contextMenu">
    <li @click="disconnect">Disconnect</li>
  </context-menu>
</div>

</template>

<style src="./port.scss"></style>

<script src="./port.ts">
</script>
