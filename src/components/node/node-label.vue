<template>
<div class="node-label" :style="styles">{{ text }}</div>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

.node-label {
  position: absolute;
  background: #888;
  color: white;
  font-size: $font-size-sm;
  line-height: $font-size-sm;
  overflow: hidden;
  white-space: nowrap;

  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;

  @extend %padding;
}
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import $ from 'jquery';

@Component
export default class NodeLabel extends Vue {
  @Prop()
  public text!: string;

  private height: number = 0;

  get styles() {
    return {
      top: -this.height + 'px',
    };
  }

  private mounted() {
    this.height = $(this.$el).outerHeight() as number;
  }
}
</script>
