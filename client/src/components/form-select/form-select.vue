<template>
  <v-select id="select" :class="['vf-select', { clearable }]"
    :options="options"
    :multiple="multiple"
    :label="label"
    v-model="childSelected"
    @input="onListSelect"
  >
    <template slot="no-options">
      <slot name="no-options"></slot>
    </template>
    <template slot="option" slot-scope="option">
      <slot name="option" :option="option">
        <div :class="{ disabled: option.disabled }">
          <a class="label">{{ option[label] }}</a>
        </div>
      </slot>
    </template>
    <template slot="selected-option" slot-scope="option">
      <slot name="selected-option" :option="option">
        {{ option[label] }}
      </slot>
    </template>
  </v-select>
</template>

<style scoped lang="scss" src="./form-select.scss"></style>

<script lang="ts" src="./form-select.ts">
</script>
