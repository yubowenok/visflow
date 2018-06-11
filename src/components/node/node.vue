<template>
<div>
  <div ref="node" v-global-click="globalClick">
    <node-cover :text="coverText"></node-cover>
  </div>
  <context-menu ref="contextMenu">
  </context-menu>
  <option-panel
      v-if="isActive"
      :initState="optionPanelInitState"
      @toggle:iconized="onToggleIconized">
  </option-panel>
</div>
</template>

<style src="./node.scss"></style>

<script src="./node.ts">
</script>
