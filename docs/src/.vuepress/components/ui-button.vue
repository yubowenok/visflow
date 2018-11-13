<template>
<span class="ui ui-button">{{ text }}</span>
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
.ui-button
  border: 1px solid rgba(0, 0, 0, .2)
</style>
