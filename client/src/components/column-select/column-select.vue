<template>
<div>
  <vue-select class="vf-select"
    v-model="selected"
    :options="columns"
    @input="onListSelect">
    <span slot="no-options">No Matching Columns</span>
  </vue-select>
</div>
</template>

<style scoped lang="scss" src="./column-select.scss"></style>

<script lang="ts" src="./column-select.ts">
</script>
