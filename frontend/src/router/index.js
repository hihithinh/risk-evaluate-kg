import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import KnowledgeManagement from '@/views/KnowledgeManagement.vue'
import SingleEvaluation from '@/views/SingleEvaluation.vue'
import BulkEvaluation from '@/views/BulkEvaluation.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/knowledge',
    name: 'KnowledgeManagement',
    component: KnowledgeManagement
  },
  {
    path: '/evaluation',
    name: 'SingleEvaluation',
    component: SingleEvaluation
  },
  {
    path: '/bulk',
    name: 'BulkEvaluation',
    component: BulkEvaluation
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
