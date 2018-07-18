<template>
<div>
  <div ref="port"
    :class="['port', { active: isActive }, DATA_TYPE]"
    @mousedown="mousedown"
    @dblclick.prevent.stop="activate"
    @contextmenu.prevent.stop="openContextMenu"
    v-global-click="globalClick">
    <div class="icon"> <!-- port icon -->
      <span><i :class="iconClasses"></i></span>
    </div>
    <transition name="slide-fade-right">
      <port-panel ref="portPanel" v-if="isActive" :port-id="id">
        <div>Data Type: {{ this.DATA_TYPE }} </div>
        <div>Number of connections: {{ this.edges.length }}</div>
      </port-panel>
    </transition>
  </div>
  <context-menu ref="contextMenu">
    <li @click="disconnect"><i class="fas fa-unlink"></i>Disconnect</li>
  </context-menu>
  <b-tooltip :target="() => $el" placement="bottom" delay="500">{{ tooltip() }}</b-tooltip>
</div>
</template>

<style src="./port.scss"></style>

<script lang="ts" src="./port.ts">
</script>
