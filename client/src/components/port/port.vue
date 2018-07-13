<template>
<div>
  <div ref="port"
    :class="['port', { active: isActive }]"
    @mousedown="mousedown"
    @dblclick.prevent.stop="activate"
    @contextmenu.prevent.stop="openContextMenu"
    v-global-click="globalClick">
    <div class="icon"> <!-- port icon -->
      <span v-if="maxConnections === 1">
        <i class="fas fa-circle"></i>
      </span>
      <span v-else-if="isSelection">
        <i class="far fa-square"></i>
      </span>
      <span v-else>
        <i class="fas fa-caret-right"></i>
      </span>
    </div>
    <transition name="slide-fade-right">
      <port-panel ref="portPanel" v-if="isActive" :port-id="id">
        <div>
          <a @click="clickLink">test link</a>
        </div>
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
