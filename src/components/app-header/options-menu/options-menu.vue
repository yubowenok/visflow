<template>
<b-nav-item-dropdown text="Options">
  <b-dropdown-item @click="toggleNodePanel">
    <i :class="['far fa-sm', nodePanelVisible ? 'fa-check-square' : 'fa-square']"></i>
    Node Panel
  </b-dropdown-item>
  <b-dropdown-item @click="toggleNodeLabels">
    <i :class="['far fa-sm', nodeLabelsVisible ? 'fa-check-square' :  'fa-square']"></i>
    Node Labels
  </b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script src="./options-menu.ts">
</script>
