<template>
<div>
  <span ref="colorDisplay" class="color-display" @click="toggleFocused()">
    <i :style="{ 'background-color': color }"></i>
  </span>
  <form-input ref="textInput" v-model="text"
    @input="onTextInput"
    @click.native="onTextClick"
  ></form-input>
  <transition name="fade">
    <vue-color ref="vueColor" v-if="isFocused"
      @input="onPaletteInput"
      :value="color"
      v-global-click="globalClick"
      disableAlpha
    ></vue-color>
  </transition>
</div>
</template>

<style scoped lang="scss" src="./color-input.scss"></style>

<script src="./color-input.ts">
</script>
