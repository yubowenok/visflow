<template>
<router-link :to="linkTo">
  <span class="ui ui-prop" :style="styles">{{ displayText }}</span>
</router-link>
</template>

<script>
import { VISUALIZATION_TYPES } from './def';

export default {
  props: {
    nodeType: {
      type: String,
    },
    text: {
      type: String,
    },
    prop: {
      type: String,
      required: true,
    },
  },
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
    },
    displayText: function() {
      if (this.text) {
        return this.text;
      }
      return this.prop.split('-').map(token => {
        return token[0].toUpperCase() + token.substr(1);
      }).join(' ');
    }
  }
}
</script>

<style scoped lang="stylus">
.ui.ui-prop
  display: inline-block
  line-height: 1rem
  background-color: #eee
  box-shadow: 1px 1px 2px rgba(0, 0, 0, .25)

  &:hover
    text-decoration: none
    background-color: #ddd
</style>
