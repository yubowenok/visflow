<template>
<b-nav-item-dropdown text="Options">
  <b-dropdown-item @click="toggleNodePanel" :disabled="isSystemInVisMode">
    <i :class="['far fa-sm', nodePanelVisible && !isSystemInVisMode ? 'fa-check-square' : 'fa-square']"></i>
    Node Panel
  </b-dropdown-item>
  <b-dropdown-item @click="toggleNodeLabels">
    <i :class="['far fa-sm', nodeLabelsVisible ? 'fa-check-square' :  'fa-square']"></i>
    Node Labels
  </b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script lang="ts" src="./options-menu.ts">
</script>
