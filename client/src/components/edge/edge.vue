<template>
<div>
  <g ref="edge" class="edge"
    @mouseover="onMouseover"
    @mouseout="onMouseout"
    @mouseup="onMouseup"
    @contextmenu.prevent.stop="$refs.contextMenu.open"
    :class="{ hovered: isHovered }"
    >
    <!-- The hover path is invisible but reacts to mouse hover. -->
    <path ref="hoverPath" :class="['curve', 'hover-path', { droppable: isNodeListDragging || isDraggedNodeDroppable }]"
      :d="getCurvePath"></path>
    <path ref="edgePath" class="curve" :d="getCurvePath"></path>
    <path ref="arrowPath" class="arrow" :d="getArrowPath"></path>
  </g>
  <context-menu ref="contextMenu">
    <li @click="contextMenuRemove"><i class="fas fa-sm fa-times"></i>Remove Edge</li>
  </context-menu>
</div>
</template>

<!-- Edge styles are not scoped because they may affect child components -->
<style src="./edge.scss"></style>

<script lang="ts" src="./edge.ts">
</script>
