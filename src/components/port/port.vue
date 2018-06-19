<template>
<div>
  <div ref="port"
    :class="['port', { active: isActive }]"
    @mousedown="mousedown"
    @dblclick.prevent.stop="activate"
    @contextmenu.prevent.stop="openContextMenu"
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
  <context-menu ref="contextMenu">
    <li>Port Menu</li>
  </context-menu>
</div>

</template>

<style src="./port.scss"></style>

<script src="./port.ts">
</script>
