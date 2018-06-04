<template>
<b-nav-item-dropdown text="Help">
  <b-dropdown-item @click="documentation"><i class="fas fa-sm fa-book"></i>Documentation</b-dropdown-item>
  <b-dropdown-item @click="issues"><i class="fas fa-sm fa-pencil-alt"></i>Issues</b-dropdown-item>
  <b-dropdown-item @click="about"><i class="fas fa-sm fa-info-circle"></i>About</b-dropdown-item>
</b-nav-item-dropdown>
</template>

<script lang="ts" src="./help-menu.ts">
</script>
