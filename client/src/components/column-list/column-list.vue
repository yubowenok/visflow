<template>
<div>
  <vue-select id="select"
    multiple
    v-model="selected"
    :options="columns"
    @input="onListSelect">
    <span slot="no-options">No Matching Columns</span>
  </vue-select>
  <div class="controls">
    <b-button id="clear" class="mini" variant="outline-secondary" @click="clear">clear</b-button>
    <b-button id="all" class="mini" variant="outline-secondary" @click="all">all</b-button>
    <b-button id="sort" class="mini" variant="outline-secondary" @click="sort"><i class="fas fa-sort-amount-up"></i></b-button>
  </div>
  <b-tooltip target="clear" placement="bottom" delay="500">Clear selected columns</b-tooltip>
  <b-tooltip target="all" placement="bottom" delay="500">Add all columns</b-tooltip>
  <b-tooltip target="sort" placement="bottom" delay="500">Sort columns by their order in the dataset</b-tooltip>
</div>
</template>

<style scoped lang="scss" src="./column-list.scss"></style>

<script lang="ts" src="./column-list.ts">
</script>
