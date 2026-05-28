<template>
  <q-layout view="hHh lpR fFf" class="bg-background-light dark:bg-background-dark">
    <q-page-container>
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-brand-light dark:text-brand-dark mb-2">🧪 STEM Cave</h1>
            <p class="text-gray-500 dark:text-gray-400">Next-generation Learning Platform</p>
          </div>
          <router-view />
        </div>
      </div>
    </q-page-container>
  </q-layout>
</template>
