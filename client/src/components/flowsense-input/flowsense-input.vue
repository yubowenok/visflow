<template>
<transition name="fade">
  <div class="flowsense-input" v-if="visible">
    <div class="label">FlowSense</div>
    <div class="input-row">
      <form-input id="input" ref="input" v-model="text" @change="onTextInput" @input="onTextSubmit" @click.native="dropdownElements = []"></form-input>
      <div :class="microphoneClass">
        <b-button id="mic" variant="outline-secondary" :pressed="isVoiceEnabled"
          @click="toggleVoice"><i class="fa fa-microphone"></i></b-button>
      </div>
    </div>
    <div class="tag-row">
      <span v-for="(token, index) in tokens" :key="index"
        :class="[ { categorized: token.categories.length > 1 },
          token.chosenCategory !== 0 ? token.categories[token.chosenCategory].category  : '']"
        @click="clickToken($event, index)">{{token.text}}</span>
      <span> </span>
    </div>
    <transition name="fade">
      <div class="dropdown" v-if="dropdownElements.length" :style="dropdownStyle">
        <div v-for="(element, index) in dropdownElements" :key="index" @click="element.onClick()"
          class="dropdown-item">
          <a>
            <span :class="element.class">{{ element.text }}</span>
            <span class="annotation">{{ element.annotation }}</span>
          </a>
        </div>
      </div>
    </transition>
    <div class="width-calibration">{{ calibratedText }}</div>
  </div>
</transition>
</template>

<style scoped lang="scss" src="./flowsense-input.scss"></style>

<script lang="ts" src="./flowsense-input.ts">
</script>
