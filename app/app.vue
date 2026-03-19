<template>
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly><AppToastContainer /></ClientOnly>
  </UApp>
</template>
