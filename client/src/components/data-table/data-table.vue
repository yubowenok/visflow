<template>
<div id="table">
  <!--
    Use inline style to override width settings so that DataTables resizes to the container width.
    Without this the DataTables may get a width of 0px set on the <table> element.
  -->
  <table ref="table"
    style="width: 100%"
    class="table table-striped table-bordered no-gutters">
  </table>
</div>
</template>

<style scoped src="./data-table.scss"></style>

<script lang="ts" src="./data-table.ts">
</script>
