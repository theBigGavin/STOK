import { createSharedComposable } from '@vueuse/core';

const _useDashboard = () => {
  const route = useRoute();
  const router = useRouter();
  const isNotificationsSlideoverOpen = ref(false);
  const showSystemStatus = ref(false);

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-i': () => router.push('/inbox'),
    'g-c': () => router.push('/customers'),
    'g-s': () => router.push('/settings'),
    n: () => (isNotificationsSlideoverOpen.value = !isNotificationsSlideoverOpen.value),
    s: () => (showSystemStatus.value = !showSystemStatus.value),
  });

  watch(
    () => route.fullPath,
    () => {
      isNotificationsSlideoverOpen.value = false;
      showSystemStatus.value = false;
    }
  );

  return {
    isNotificationsSlideoverOpen,
    showSystemStatus,
  };
};

export const useDashboard = createSharedComposable(_useDashboard);
