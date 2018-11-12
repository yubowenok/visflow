<template>
<router-link id="ui-prop" :to="linkTo">
  <span class="ui" :style="styles"><slot></slot></span>
</router-link>
</template>

<script>
import { VISUALIZATION_TYPES } from './def.ts';

export default {
  props: ['nodeType', 'prop'],
  computed: {
    linkTo: function() {
      if (!this.nodeType) {
        return `#${this.prop}`;
      }
      if (VISUALIZATION_TYPES.indexOf(this.nodeType) !== -1) {
        return `/node/visualization/${this.nodeType}.html#${this.prop}`;
      } else {
        return `/node/${this.nodeType}.html#${this.prop}`;
      }
    },
    styles: function() {
      if (!this.nodeType && !this.prop) {
        return 'cursor: default';
      }
      return '';
    }
  }
}
</script>

<style scoped lang="stylus">
#ui-prop
  .ui
    background-color: #eee
    box-shadow: 1px 1px 2px rgba(0, 0, 0, .25)

  &:hover
    text-decoration: none

    .ui
      background-color: #ddd
</style>
