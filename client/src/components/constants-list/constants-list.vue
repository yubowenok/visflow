<template>
<div>
  <div ref="constants">
    <div class="constant" v-for="(val, index) in value" :key="index" :id="index">
      {{ val }}
      <i class="close fas fa-times" @click="remove(index)"></i>
    </div>
  </div>
  <div class="controls">
    <b-form-input class="entry" v-model="entry" @keydown.enter.native.prevent="add"></b-form-input>
    <b-button id="add" class="mini" variant="outline-secondary" :disabled="!entry" @click="add"><i class="fas fa-plus"></i></b-button>
    <b-button id="clear" class="mini" variant="outline-secondary" @click="clear">clear</b-button>
  </div>
</div>
</template>

<style lang="scss" src="./constants-list.scss"></style>

<script lang="ts" src="./constants-list.ts">
</script>
