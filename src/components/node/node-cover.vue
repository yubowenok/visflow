<template>
<div class="node-cover">
  <div class="cover"></div>
  <div class="text">{{ text }}</div>
</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

.node-cover {
  position: absolute;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  pointer-events: none;
  z-index: $zIndexNodeCover;
  margin: 1px;
}

.cover {
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, white 0, #eee 1);
}

.text {
  position: absolute;
  top: calc(50% - 1em * .75);
  width: 100%;
  text-align: center;
}
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class NodeCover extends Vue {
  @Prop()
  private text!: string;
}
</script>
