<template>
<form-select
  v-model="scaleId"
  :options="colorScaleOptions"
  :clearable="clearable"
  @change="onScaleSelect"
>
  <template slot="option" slot-scope="{ option }">
    <div>
      <div>{{ option.label }}</div>
      <color-scale-display :id="option.id" class="color-scale-display"></color-scale-display>
    </div>
  </template>
  <template slot="selected-option" slot-scope="{ option }">
    <div>
      <color-scale-display :id="option.id" class="color-scale-display"></color-scale-display>
    </div>
  </template>
</form-select>
</template>

<style scoped lang="scss" src="./color-scale-select.scss"></style>

<script lang="ts" src="./color-scale-select.ts">
</script>
