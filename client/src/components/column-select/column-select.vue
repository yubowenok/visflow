<template>
<div>
  <vue-select id="select"
    v-model="selected"
    :clearable="clearable"
    :options="columns"
    @input="onListSelect">
    <span slot="no-options">No Matching Columns</span>
  </vue-select>
</div>
</template>

<style scoped lang="scss" src="./column-select.scss"></style>

<script lang="ts" src="./column-select.ts">
</script>
