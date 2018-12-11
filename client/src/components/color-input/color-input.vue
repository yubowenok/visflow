<template>
<div>
  <span ref="colorDisplay" class="color-display" @click="toggleFocused()">
    <i :style="{ 'background-color': color }"></i>
  </span>
  <form-input ref="textInput" v-model="text"
    @input="onTextInput"
    @change="onTextChange"
    @click.native="onTextClick"
  ></form-input>
  <transition name="fade">
    <vue-color ref="vueColor" v-if="isFocused"
      v-global-click="globalClick"
      disableAlpha
      :value="color"
      @input="onPaletteInput"
    ></vue-color>
  </transition>
</div>
</template>

<style scoped lang="scss" src="./color-input.scss"></style>

<script src="./color-input.ts">
</script>
