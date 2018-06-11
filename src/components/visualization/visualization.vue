<template>
<div>
  <div ref="node" v-global-click="globalClick">
    <node-cover :text="coverText"></node-cover>
  </div>
  <context-menu id="context-menu" ref="contextMenu">
    <template slot-scope="slotProps">
      <li @click="testOption">
        <i class="fas fa-sm fa-plus"></i>
        Visualization Option
      </li>
    </template>
  </context-menu>
  <option-panel
      v-if="isActive"
      :initState="optionPanelInitState"
      @toggle:iconized="onToggleIconized">
      hihi
  </option-panel>
</div>
</template>

<script src="./visualization.ts">
</script>
