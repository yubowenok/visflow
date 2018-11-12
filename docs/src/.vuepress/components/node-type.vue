<template>
<router-link :to="linkTo" class="node-type">
  <a>{{ name }}</a>
  <div class="icon" :style="styles"></div>
</router-link>
</template>

<script>
import { NODE_ICON, NODE_NAME, VISUALIZATION_TYPES } from './def.ts';

export default {
  props: {
    type: {
      type: String,
      default: 'unknown',
      required: true,
    },
  },
  computed: {
    name: function() {
      return NODE_NAME[this.type];
    },
    styles: function() {
      return {
        'background-image': `url(/icon/${NODE_ICON[this.type]})`,
      };
    },
    linkTo: function() {
      return VISUALIZATION_TYPES.indexOf(this.type) !== -1 ?
        `/node/visualization/${this.type}.html` :
        `/node/${this.type}.html`;
    },
  },
}
</script>

<style lang="scss">
.node-type {
  .icon {
    background-position: center;
    background-repeat: no-repeat;
    background-size: 2rem 2rem;
    background-color: white;
    display: inline-block;
    position: relative;
    top: .5rem;
    padding: .25rem;
    width: 1.5rem;
    height: 1.5rem;
    border: 1px solid #ccc;
  }

  /*
  &:hover {
    .icon {
      transform: scale(1.25);
      transition: .2s;
    }
  }
  */
}
</style>
