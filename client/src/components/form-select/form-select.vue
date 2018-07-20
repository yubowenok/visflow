<template>
  <v-select id="select" :class="['vf-select', { clearable: !clearable }]"
    :options="options"
    :multiple="multiple"
    v-model="childSelected"
    @input="onListSelect"
  >
    <template slot="no-options">
      <slot name="no-options"></slot>
    </template>
  </v-select>
</template>

<style scoped lang="scss" src="./form-select.scss"></style>

<script lang="ts" src="./form-select.ts">
</script>
