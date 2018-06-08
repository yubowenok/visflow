<template>
<div @contextmenu.prevent.stop="$refs.contextMenu.open">
  <node-cover :text="coverText"></node-cover>
  <context-menu id="context-menu" ref="contextMenu">
  <template slot-scope="slotProps">
    <li>
      <i class="fas fa-sm fa-plus"></i>
      Visualization Option
    </li>
  </template>
</context-menu>
</div>
</template>

<script src="./visualization.ts">
</script>
