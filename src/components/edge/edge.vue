<template>
<g class="edge">
  <path ref="edgePath" class="curve" :d="getCurvePath"></path>
  <path ref="arrowPath" class="arrow" :d="getArrowPath"></path>
</g>
</template>

<!-- Edge styles are not scoped because they may affect child components -->
<style src="./edge.scss"></style>

<script src="./edge.ts">
</script>
