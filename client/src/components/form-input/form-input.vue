<template>
<input v-model="text" @input="onInput" class="form-control"
  :disabled="disabled"
  @blur="save"
  @keyup.enter.esc="save"
/>
</template>

<script lang="ts" src="./form-input.ts">
</script>
