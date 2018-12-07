<template>
<b-modal v-model="visible" :title="title" @keydown.enter.native="onEnter" :size="size">
  <div v-if="error" class="modal-message error">{{ error }}</div>
  <slot name="content"></slot>
  <div slot="modal-footer">
    <div class="float-right">
      <slot name="footer">
        <b-btn variant="outline-secondary" @click="close">Cancel</b-btn>
      </slot>
    </div>
  </div>
</b-modal>
</template>

<script lang="ts" src="./base-modal.ts">
</script>
