<template>
<span>
  <template v-if="keys">
    <span v-for="(key, index) in keys" :key="index" :title="key">
      <span :class="['shortcut', {
        hold: hold && hold.indexOf(key) !== -1,
        action: key.match(/click|drag|tab|enter/) !== null,
      }]">{{ getKeyText(key) }}</span>
      <span v-if="index !== keys.length - 1">+</span>
    </span>
  </template>
</span>
</template>

<script>
const isMac = function() {
  if (typeof global !== 'undefined') { // get around js compiler error of "window is not defined"
    return '';
  }
  return window.navigator.appVersion.match(/Mac/) !== null;
};

const KEY_TEXT = {
  alt: '⌥',
  ctrlMac: '⌘',
  ctrl: '⌃',
  shift: '⇧',
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
};

export default {
  props: ['keys', 'hold'],
  methods: {
    getKeyText: function(key) {
      if (key === 'ctrl') {
        return isMac() ? KEY_TEXT['ctrlMac'] : KEY_TEXT['ctrl'];
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
  min-width: 2rem
  background-color: white
  border: 1px solid #ccc
  border-radius: 4px
  box-shadow: 0 1px 0 #ccc
  margin-left: .25rem;

  &.hold
    background-color: #eee
    box-shadow: 0 -2px 0 #ccc

  &.action
    padding-left: .25rem
    padding-right: .25rem
</style>
