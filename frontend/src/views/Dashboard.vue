<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-12 text-center">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">Risk Evaluation System</h1>
        <p class="text-xl text-gray-600">Hệ thống đánh giá rủi ro doanh nghiệp</p>
      </div>
      
      <!-- Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Knowledge Management Card -->
        <router-link 
          to="/knowledge" 
          class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
        >
          <div class="bg-gradient-to-br from-yellow-400 to-yellow-500 p-8 h-64 flex flex-col justify-between">
            <div>
              <div class="text-4xl mb-4">📚</div>
              <h2 class="text-3xl font-bold text-gray-900 mb-3">Knowledge Management</h2>
              <p class="text-gray-800">Quản lý knowledge graph và rules</p>
            </div>
            <div class="flex items-center text-gray-900 font-medium">
              <span>Explore</span>
              <svg class="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </router-link>
        
        <!-- Single Evaluation Card -->
        <router-link 
          to="/evaluation"
          class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
        >
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-8 h-64 flex flex-col justify-between text-white">
            <div>
              <div class="text-4xl mb-4">🏢</div>
              <h2 class="text-3xl font-bold mb-3">Single Company</h2>
              <p class="text-blue-100">Đánh giá rủi ro 1 công ty</p>
            </div>
            <div class="flex items-center font-medium">
              <span>Evaluate</span>
              <svg class="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </router-link>
        
        <!-- Bulk Evaluation Card -->
        <router-link 
          to="/bulk"
          class="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
        >
          <div class="bg-gradient-to-br from-green-500 to-green-600 p-8 h-64 flex flex-col justify-between text-white">
            <div>
              <div class="text-4xl mb-4">📊</div>
              <h2 class="text-3xl font-bold mb-3">Bulk Evaluation</h2>
              <p class="text-green-100">Đánh giá rủi ro nhiều công ty</p>
            </div>
            <div class="flex items-center font-medium">
              <span>Upload CSV</span>
              <svg class="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dashboard component
</script>
