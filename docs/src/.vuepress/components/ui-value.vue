<template>
<span class="ui ui-value">{{ text }}</span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped lang="stylus">
.ui-value
  line-height: 1rem
  display: inline-block
  border: 1px solid rgba(0, 0, 0, .2)
  border-radius: 12px
</style>
