<template>
<div class="ui ui-button">
  <i :class="iconClasses" v-if="iconClasses"></i>
  <span v-if="text">{{ text }}</span>
  <i class="fas fa-caret-down" v-if="dropdown"></i>
</div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    iconClasses: {
      type: String,
    },
    dropdown: {
      type: Boolean,
    },
  },
}
</script>

<style scoped lang="stylus">
.ui-button
  display: inline-block
  padding: 0 .25rem
  border: 1px solid rgba(0, 0, 0, .2)
  margin-right: .1rem

i
  font-size: .9em

</style>
