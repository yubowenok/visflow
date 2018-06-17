<template>
<g class="edge drawing"> <!-- edge styles set by edge.scss -->
  <line class="curve" :x1="start.x" :y1="start.y" :x2="end.x" :y2="end.y"></line>
  <path class="arrow" :d="getArrowPath"></path>
</g>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

@keyframes moving {
  from {
    stroke-dashoffset: 12px;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.edge.drawing {
  pointer-events: none;

  line {
    stroke-dasharray: 8px 4px;
    animation-name: moving;
    animation-duration: .5s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
}
</style>

<script src="./drawing-edge.ts">
</script>
