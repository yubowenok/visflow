<template>
<span>
  <template v-if="keys">
    <span v-for="(key, index) in keys" :key="index">
      <span :class="['shortcut', { hold: hold && hold.indexOf(key) !== -1 }]">{{ getKeyText(key) }}</span>
      <span v-if="index !== keys.length - 1">+</span>
    </span>
  </template>
</span>
</template>

<script>
const KEY_TEXT = {
  alt: '⌥',
  ctrlMac: '⌘',
  ctrl: '⌃',
  shift: '⇧',
};

export default {
  props: ['keys', 'hold'],
  computed: {
    isMac: function() {
      return window.navigator.appVersion.match(/Mac/);
    },
    ctrl: function() {
      return this.isMac ? '⌘' : '⌃';
    },
  },
  methods: {
    getKeyText: function(key) {
      if (key === 'ctrl') {
        return this.isMac ? KEY_TEXT['ctrlMac'] : KEY_TEXT['ctrl'];
      }
      if (!(key in KEY_TEXT)) {
        return key;
      }
      return KEY_TEXT[key];
    },
  },
}
</script>

<style scoped lang="stylus">
.shortcut
  display: inline-block
  text-align: center
  height: 1.1rem
  line-height: 1.1rem
  font-size: .9rem
  width: 2rem
  background-color: white
  border: 1px solid #ccc
  border-radius: 4px
  box-shadow: 0 1px 0 #ccc
  margin-left: .25rem;

  &.hold
    background-color: #eee
    box-shadow: 0 -2px 0 #ccc
</style>
