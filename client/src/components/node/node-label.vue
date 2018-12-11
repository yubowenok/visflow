<template>
<transition name="slide-fade-bottom">
  <div class="node-label" :style="styles">{{ text }}</div>
</transition>
</template>

<style scoped lang="scss">
@import '../../common/style/index';

.node-label {
  position: absolute;
  background: #888;
  color: white;
  font-size: $font-size-sm;
  left: .25rem;
  @extend %ellipsis-text;

  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;

  padding-left: .5rem;
  padding-right: .5rem;
}
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import $ from 'jquery';

@Component
export default class NodeLabel extends Vue {
  @Prop()
  public text!: string;
  @Prop()
  private maxWidth!: number;

  private height: number = 0;

  get styles() {
    return {
      'top': -this.height + 'px',
      'max-width': this.maxWidth + 'px',
    };
  }

  private mounted() {
    this.height = $(this.$el).outerHeight() as number;
  }
}
</script>
