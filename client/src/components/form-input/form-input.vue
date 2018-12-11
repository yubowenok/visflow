<template>
<input ref="input" v-model="text" @input="onInput" class="form-control"
  :disabled="disabled"
  :maxlength="maxlength"
  @blur="save"
  @select="onSelect"
  @keydown="onKeydown"
  @keyup.enter.esc="save"
/>
</template>

<script lang="ts" src="./form-input.ts">
</script>
