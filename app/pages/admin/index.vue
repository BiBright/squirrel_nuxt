<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="title01 page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Platform overview</p>
      </div>
    </div>

    <div class="dashboard__stats">
      <div class="dashboard__stat-card">
        <p class="stat-label">Companies</p>
        <p class="stat-value">2</p>
        <p class="stat-trend">1 Premium · 1 Free</p>
      </div>
      <div class="dashboard__stat-card">
        <p class="stat-label">Total Users</p>
        <p class="stat-value">15</p>
        <p class="stat-trend">12 staff · 3 suppliers</p>
      </div>
      <div class="dashboard__stat-card">
        <p class="stat-label">Total Requests</p>
        <p class="stat-value">160</p>
        <p class="stat-trend">Across all companies</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'master' })
</script>
