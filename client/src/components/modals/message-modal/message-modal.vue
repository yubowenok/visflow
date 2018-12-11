<template>
<base-modal ref="modal" :title="options.title"
  :visible-state="messageModalVisible"
  :on-open="openMessageModal"
  :on-close="closeMessageModal"
  :on-enter="proceed"
  >
  <template slot="content">
    <b-container fluid>
      {{ options.message }}
    </b-container>
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-secondary" @click="proceed">{{ confirmText }}</b-btn>
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
  </template>
</base-modal>
</template>

<script lang="ts" src="./message-modal.ts">
</script>
