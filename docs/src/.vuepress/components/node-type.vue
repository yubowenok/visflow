<template>
<router-link :to="linkTo" class="node-type">
  <a>{{ name }}</a>
  <div class="icon" :style="styles"></div>
</router-link>
</template>

<script>

const NAME = {
  'unknown': '(unknown)',
  'data-source': 'Data Source',
  'table': 'Table',
  'scatterplot': 'Scatterplot',
  'parallel-coordinates': 'Parallel Coordinates',
  'histogram': 'Histogram',
  'heatmap': 'Heatmap',
  'line-chart': 'Line Chart',
  'network': 'Network',
  'map': 'Map',
  'visual-editor': 'Visual Editor',
  'attribute-filter': 'Attribute Filter',
  'set-operator': 'Set Operator',
  'constant-generator': 'Constant Generator',
  'linker': 'Linker',
};

const IMG = {
  'unknown': '',
  'data-source': '/data-source.svg',
  'table': '/table.svg',
  'scatterplot': '/scatterplot.svg',
  'parallel-coordinates': '/parallel-coordinates.svg',
  'histogram': '/histogram.svg',
  'heatmap': '/heatmap.svg',
  'line-chart': '/line-chart.svg',
  'network': '/network.svg',
  'map': '/map.svg',
  'visual-editor': '/visual-editor.svg',
  'attribute-filter': '/attribute-filter.svg',
  'set-operator': '/set-operator.svg',
  'constant-generator': '/constant-generator.svg',
  'linker': '/linker.svg',
};

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
      return NAME[this.type];
    },
    styles: function() {
      return {
        'background-image': `url(/icon/${IMG[this.type]})`,
      };
    },
    linkTo: function() {
      return `/node-type/${this.type}/`;
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
