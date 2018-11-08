<template>
<router-link :to="linkTo" class="port-type">
  <a>{{ name }}</a>
  <span class="icon-wrapper">
    <i :class="['icon', classes]" :style="iconStyles"></i>
  </span>
</router-link>
</template>

<script>

const NAME = {
  'input': 'Input Port',
  'multi-input': 'Multiple Input Port',
  'output': 'Output Port',
  'selection': 'Selection Port',
};

const CLASSES = {
  'input': 'fas fa-circle',
  'multi-input': 'fas fa-caret-right',
  'output': 'fas fa-caret-right',
  'selection': 'far fa-square',
};

const ICON_STYLE = {
  'input': 'font-size: .3rem; top: -.55rem;',
  'multi-input': 'font-size: 1rem; top: -.3rem;',
  'output': 'font-size: 1rem; top: -.3rem;',
  'selection': 'font-size: .55rem; top: -.5rem;',
}

export default {
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    name: function() {
      return NAME[this.type];
    },
    classes: function() {
      return CLASSES[this.type];
    },
    linkTo: function() {
      return `/port/`;
    },
    iconStyles: function() {
      return ICON_STYLE[this.type];
    },
  },
}
</script>

<style lang="scss">
.port-type {
  .icon-wrapper {
    width: 1rem;
    height: 1rem;
    display: inline-block;
    position: relative;
    border: 1px solid #ccc;
    border-radius: 2px;
    text-align: center;
    top: .25rem;

    .icon {
      color: #2c3e50;
      position: relative;
    }
  }
}
</style>
