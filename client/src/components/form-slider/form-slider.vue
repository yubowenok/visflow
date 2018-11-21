<template>
<input ref="range" type="range" :min="min" :max="max"
  v-model="slideValue"
  :disabled="disabled"
  @input="onInput"
  @blur="save"
/>
</template>

<style scoped lang="scss" src="./form-slider.scss"></style>

<script lang="ts" src="./form-slider.ts">
</script>
