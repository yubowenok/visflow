<template>
<span>
  <span class="btn" @click="copy(text)">
    <a>BibTex <i class="btn far fa-copy"></i></a>
    <span class="small" v-if="messageVisible">bibtex copied</span>
  </span>
  <pre v-if="textVisible" class="language-text">{{ text }}</pre>
</span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  data: () => {
    return {
      textVisible: false,
      messageVisible: false,
    };
  },
  methods: {
    copy: function(text) {
      if (this.messageVisible) {
        this.messageVisible = false;
        this.textVisible = false;
        return;
      }
      this.messageVisible = true;
      this.textVisible = true;
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        alert('copy is not supported by your browser');
      }
      document.body.removeChild(textArea);
    }
  }
}
</script>

<style scoped lang="stylus">
.btn
  cursor: pointer
  i
    display: inline-block
    line-height: 1rem
    color: #777

.small
  font-size: .8em

.language-text
  font-size: 0.8em
</style>
