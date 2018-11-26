<template>
<transition name="fade">
  <div class="flowsense-input" v-if="visible">
    <div class="label">FlowSense</div>
    <i v-if="isWaiting" class="fas fa-circle-notch fa-spin"></i>
    <div class="input-row">
      <form-input id="input" ref="input" v-model="text" :disabled="isWaiting"
        @input="onTextInput"
        @keyup.enter.native="onEnter"
        @destroyed="onHideInput"
        @keydown.native.tab.prevent.stop="onTab"
        @keydown.native.down.prevent.stop="onArrowDown"
        @keydown.native.up.prevent.stop="onArrowUp"
        @click.native="closeAllDropdowns">
      </form-input>
      <div id="buttons">
        <div v-if="this.tokens.length">
          <b-button id="auto-complete" variant="outline-secondary"
            @click="onClickQueryCompletion">
            <i class="fas fa-question"></i>
          </b-button>
        </div>
        <div :class="microphoneClass">
          <b-button id="mic" variant="outline-secondary" :pressed="isVoiceEnabled" @click="toggleVoice">
            <i class="fas fa-microphone"></i></b-button>
        </div>
      </div>

    </div>
    <div class="tag-row">
      <span v-for="(token, index) in tokens" :key="index"
        :class="[ { categorized: token.categories.length > 1 },
          token.chosenCategory !== 0 ? token.categories[token.chosenCategory].category  : '']"
        @click="clickToken($event, index)">{{token.text}}</span>
    </div>
    <transition name="fade">
      <div class="dropdown" v-if="tokenCategoryDropdown.length" :style="tokenCategoryDropdownStyle">
        <div v-for="(element, index) in tokenCategoryDropdown" :key="index" @click="element.onClick()"
          class="dropdown-item">
          <a>
            <span :class="element.class">{{ element.text }}</span>
            <span class="annotation">{{ element.annotation }}</span>
          </a>
        </div>
      </div>
    </transition>
    <div class="dropdown" v-if="tokenCompletionDropdown.length" :style="tokenCompletionDropdownStyle">
      <div v-for="(element, index) in tokenCompletionDropdown" :key="index" @click="element.onClick()"
        :class="['dropdown-item', { highlight: index === tokenCompletionDropdownSelectedIndex }]">
        <a>
          <span :class="element.class">{{ element.text }}</span>
          <span class="annotation">{{ element.annotation }}</span>
        </a>
      </div>
    </div>
    <div class="dropdown" v-if="queryCompletionDropdown.length">
      <div v-for="(element, index) in queryCompletionDropdown" :key="index" @click="element.onClick()"
        :class="['dropdown-item', { highlight: index === queryCompletionDropdownSelectedIndex }]">
        <span v-for="(token, index) in element.tokens" :key="index"
          :class="[ { categorized: token.categories.length > 1 },
            token.chosenCategory !== 0 ? token.categories[token.chosenCategory].category  : '']"
        >{{token.text}}</span>
      </div>
    </div>
    <div class="dropdown" v-if="queryCompletionMessage">
      <span class="dropdown-item">{{ queryCompletionMessage }}</span>
    </div>
    <div class="width-calibration">{{ calibratedText }}</div>
  </div>
</transition>
</template>

<style scoped lang="scss" src="./flowsense-input.scss"></style>

<script lang="ts" src="./flowsense-input.ts">
</script>
