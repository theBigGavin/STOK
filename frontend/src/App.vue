<template>
    <div id="app">
        <router-view />
    </div>
</template>

<script setup lang="ts">
// 应用根组件
</script>

<style>
#app {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html,
body {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>