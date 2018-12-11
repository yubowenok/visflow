<template>
<div>
  <h5>Upload data file</h5>
  <transition name="slide-fade-top">
    <div v-if="successMessage" class="modal-message success">{{ successMessage }}</div>
  </transition>
  <transition name="slide-fade-top">
    <div v-if="errorMessage" class="modal-message error">{{ errorMessage }}</div>
  </transition>
  <div class="upload-progress" v-if="uploadState === 'uploading'">
    <div>Uploading {{filename}}...</div>
    <b-progress>
      <b-progress-bar :value="uploadPercentage" :label="uploadPercentage + '%'"></b-progress-bar>
    </b-progress>
  </div>
  <form enctype="multipart/form-data" novalidate>
    <div :class="['drop-area', {
        disabled: !isLoggedIn,
        active: uploadState === 'dragging',
      }]"
    >
      <template v-if="isLoggedIn">
        <div v-if="uploadState === 'waiting'" class="text">Drag a file here or click to browse</div>
        <div v-if="uploadState === 'dragging'" class="text">Drop file here to upload</div>
      </template>
      <template v-else>
        <div class="text">Please login to upload data</div>
      </template>
      <input type="file"
        :disabled="uploadState !== 'waiting'"
        @change="onFileChange($event.target.files)"
        accept=".csv"
        class="input-file"
        @dragover.prevent="onFileDragover"
        @dragleave.prevent="onFileDragleave"
        @drop.prevent="onFileDrop"
      >
    </div>
  </form>
</div>
</template>

<style scoped lang="scss" src="./file-upload.scss"></style>

<script lang="ts" src="./file-upload.ts">
</script>
