<template>
<span :class="['ui', classes]">{{ text }}</span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: '',
    },
  },
  computed: {
    classes: function() {
      return this.type;
    },
  }
}
</script>

<style scoped lang="stylus">
.ui
  display: inline-block
  line-height: 1rem
  color: #333
  opacity: .8

.column
  background-color: #98ca3c
.node-type
  color: white
  background-color: #572e87
.node-label
  background-color: #d8ebb4
.dataset
  background-color: #b8e0f9
</style>
