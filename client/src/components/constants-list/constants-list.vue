<template>
<div>
  <div ref="constants" :class="['constant-list', { disabled }]">
    <div class="constant" v-for="(val, index) in value" :key="index" :id="index">
      {{ display(val) }}
      <i v-if="!disabled" class="close fas fa-times" @click="remove(index)"></i>
    </div>
  </div>
  <div class="controls" v-if="!disabled">
    <b-form-input class="entry" v-model="entry" @keydown.enter.native.prevent="add"></b-form-input>
    <b-button id="add" class="mini" variant="outline-secondary" :disabled="!entry" @click="add"><i class="fas fa-plus"></i></b-button>
    <b-button id="add-list" class="mini" variant="outline-secondary" :disabled="!entry" @click="addList">
      <i class="fas fa-plus"></i>
      <i class="fas fa-plus"></i>
    </b-button>
    <b-button id="clear" class="mini" variant="outline-secondary" @click="clear">clear</b-button>
    <b-tooltip target="add-list" delay="300" placement="bottom">Add a list of values separated by comma</b-tooltip>
  </div>
</div>
</template>

<style lang="scss" src="./constants-list.scss"></style>

<script lang="ts" src="./constants-list.ts">
</script>
