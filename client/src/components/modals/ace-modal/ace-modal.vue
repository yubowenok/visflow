<template>
<base-modal ref="modal" title="Script Editor"
  :visible-state="visible"
  :on-open="open"
  :on-close="close"
  size="lg"
  >
  <template slot="content">
    <slot></slot>
    <ace-editor v-model="code"
      @input="onCodeInput"
    ></ace-editor>
  </template>
  <template slot="footer">
    <div>
      <b-btn variant="outline-primary" @click="run">run</b-btn>
      <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      <b-btn variant="outline-success" @click="save">Save</b-btn>
    </div>
  </template>
</base-modal>
</template>

<style scoped lang="scss" src="./ace-modal.scss"></style>

<script lang="ts" src="./ace-modal.ts">
</script>
