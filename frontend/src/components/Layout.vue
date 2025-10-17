<template>
    <el-container class="layout-container">
        <!-- 侧边栏 -->
        <el-aside :width="sidebarWidth" class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
            <div class="logo">
                <h2 v-if="!isCollapsed">STOK</h2>
                <h3 v-else>S</h3>
            </div>

            <el-menu :default-active="activeMenu" class="sidebar-menu" :collapse="isCollapsed"
                :collapse-transition="false" router background-color="#001529" text-color="#fff"
                active-text-color="#409eff">
                <template v-for="route in menuRoutes" :key="route.name">
                    <el-menu-item :index="route.path">
                        <el-icon>
                            <component :is="route.meta?.icon" />
                        </el-icon>
                        <template #title>{{ route.meta?.title }}</template>
                    </el-menu-item>
                </template>
            </el-menu>
        </el-aside>

        <!-- 主内容区域 -->
        <el-container>
            <!-- 头部 -->
            <el-header class="header">
                <div class="header-left">
                    <el-button text :icon="isCollapsed ? 'Expand' : 'Fold'" @click="toggleSidebar" />
                    <el-breadcrumb separator="/" class="breadcrumb">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item>{{ currentRouteTitle }}</el-breadcrumb-item>
                    </el-breadcrumb>
                </div>

                <div class="header-right">
                    <el-button text :icon="themeIcon" @click="toggleTheme">
                        {{ themeText }}
                    </el-button>
                    <el-dropdown @command="handleCommand">
                        <span class="user-info">
                            <el-avatar :size="32" :src="userAvatar" />
                            <span class="username">{{ userName }}</span>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                                <el-dropdown-item command="settings">设置</el-dropdown-item>
                                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </el-header>

            <!-- 内容区域 -->
            <el-main class="main-content">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/store'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 侧边栏状态
const isCollapsed = computed(() => appStore.sidebarCollapsed)
const sidebarWidth = computed(() => isCollapsed.value ? '64px' : '200px')

// 当前主题
const currentTheme = computed(() => appStore.theme)
const themeIcon = computed(() => currentTheme.value === 'light' ? 'Moon' : 'Sunny')
const themeText = computed(() => currentTheme.value === 'light' ? '暗色' : '亮色')

// 用户信息
const userName = computed(() => userStore.userInfo?.username || '用户')
const userAvatar = computed(() => userStore.userInfo?.avatar || '')

// 菜单路由
const menuRoutes = computed(() => {
    return router.getRoutes()
        .filter(route => route.meta?.title && route.meta?.icon && route.name !== 'NotFound')
        .sort((a, b) => {
            const order = ['Dashboard', 'Stocks', 'Decisions', 'Models', 'Backtest']
            return order.indexOf(a.name as string) - order.indexOf(b.name as string)
        })
})

// 当前激活菜单
const activeMenu = computed(() => route.path)
const currentRouteTitle = computed(() => route.meta?.title as string || '')

// 切换侧边栏
const toggleSidebar = () => {
    appStore.sidebarCollapsed = !appStore.sidebarCollapsed
}

// 切换主题
const toggleTheme = () => {
    appStore.theme = appStore.theme === 'light' ? 'dark' : 'light'
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
    switch (command) {
        case 'profile':
            // 跳转到个人中心
            break
        case 'settings':
            // 跳转到设置页面
            break
        case 'logout':
            userStore.userInfo = null
            userStore.permissions = []
            userStore.isLoggedIn = false
            router.push('/login')
            break
    }
}
</script>

<style scoped>
.layout-container {
    height: 100vh;
}

.sidebar {
    background-color: #001529;
    transition: width 0.3s;
    overflow: hidden;
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border-bottom: 1px solid #333;
}

.logo h2,
.logo h3 {
    margin: 0;
    font-weight: bold;
}

.sidebar-menu {
    border: none;
    height: calc(100vh - 60px);
}

.sidebar-menu:not(.el-menu--collapse) {
    width: 200px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid #e6e6e6;
    background-color: #fff;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.breadcrumb {
    margin-left: 10px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.user-info:hover {
    background-color: #f5f5f5;
}

.username {
    font-size: 14px;
    color: #333;
}

.main-content {
    padding: 20px;
    background-color: #f5f5f5;
    overflow-y: auto;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>