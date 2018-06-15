<template>
<div class="edge"> <!-- edge styles set by edge.scss -->
  <svg>
    <line :x1="x1" :y1="y1" :x2="x2" :y2="y2"></line>
    <path :d="arrowPath"></path>
  </svg>
</div>

</template>

<style scoped lang="scss">
svg, div {
  width: 100%;
  height: 100%;
}
</style>

<script src="./drawing-edge.ts">
</script>
