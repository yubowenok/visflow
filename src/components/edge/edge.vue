<template>
<div>
  <g ref="edge" class="edge"
    @mouseover="isHovered = true"
    @mouseout="isHovered = false"
    @contextmenu.prevent.stop="$refs.contextMenu.open"
    :class="{ hovered: isHovered }"
    >
    <!-- The hover path is invisible but reacts to mouse hover. -->
    <path class="curve hover-path" :d="getCurvePath"></path>
    <path ref="edgePath" class="curve" :d="getCurvePath"></path>
    <path ref="arrowPath" class="arrow" :d="getArrowPath"></path>
  </g>
  <context-menu ref="contextMenu">
    <li>edge menu</li>
  </context-menu>
</div>
</template>

<!-- Edge styles are not scoped because they may affect child components -->
<style src="./edge.scss"></style>

<script src="./edge.ts">
</script>
