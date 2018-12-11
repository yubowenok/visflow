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
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  pointer-events: none;
  z-index: $zIndexNodeCover;
  margin: 2px;
}

.cover {
  position: absolute;
  z-index: -1;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, white 0%, #eee 100%);
}

.text {
  position: absolute;
  width: 100%;
  text-align: center;
  @extend %vertical-center;
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
