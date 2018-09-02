<template>
<transition name="fade">
  <div class="flowsense-input" v-if="visible">
    <div class="label">FlowSense</div>
    <div class="input-row">
      <form-input id="input" v-model="text" @change="onTextInput" @input="onTextSubmit"></form-input>
      <b-button id="mic" variant="outline-secondary" :pressed="isVoiceEnabled"
        @click="toggleVoice"><i class="fa fa-microphone"></i></b-button>
    </div>
    <div class="tag-row">
      <span v-for="(token, index) in tokens" :key="index"
        :class="token.category !== 'none' ? 'categorized ' + token.category : ''">{{token.text}}</span>
      <span> </span>
    </div>
    <div class="width-calibration">{{ calibratedText }}</div>
  </div>
</transition>
</template>

<style scoped lang="scss" src="./flowsense-input.scss"></style>

<script lang="ts" src="./flowsense-input.ts">
</script>
