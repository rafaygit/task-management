import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ThemeService } from '../services/theme.service';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  assignedTo?: {
    id: number;
    username: string;
    role: string;
  };
  organization: {
    id: number;
    name: string;
  };
}

interface UserInfo {
  username: string;
  role: string;
  userId: number;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div class="max-w-6xl mx-auto p-4 sm:p-6">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
                <p class="text-gray-600 dark:text-gray-300" *ngIf="userInfo">
                  Welcome back, {{ userInfo.username }}! 
                  <span class="ml-2 px-2 py-1 text-xs font-semibold rounded-full"
                        [class]="userInfo.role === 'Owner' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                 userInfo.role === 'Admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'">
                    {{ userInfo.role }}
                  </span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button 
                *ngIf="canCreateTasks()" 
                (click)="showCreateForm = true" 
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                New Task
              </button>
              <!-- Theme Toggle -->
              <button 
                (click)="toggleTheme()" 
                class="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                [class]="isDarkMode ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'"
                title="Toggle theme"
              >
                <svg *ngIf="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
                <svg *ngIf="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </button>
              <button (click)="logout()" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl font-semibold transition-all duration-200 border border-gray-200 dark:border-gray-600">
                <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
        
        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-2">
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Search Tasks</label>
              <input 
                type="text" 
                placeholder="Type to search..." 
                [(ngModel)]="searchTerm"
                (input)="filterTasks()"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Status</label>
              <select 
                [(ngModel)]="statusFilter" 
                (change)="filterTasks()"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Sort By</label>
              <select 
                [(ngModel)]="sortBy" 
                (change)="sortTasks()"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="title">Title</option>
                <option value="created">Created Date</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      
        <!-- Create Task Form -->
        <div *ngIf="showCreateForm" class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 dark:border-gray-700">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h3>
          </div>
          <form (ngSubmit)="createTask()" #taskForm="ngForm" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Task Title</label>
              <input 
                type="text" 
                [(ngModel)]="newTask.title" 
                name="title" 
                required
                placeholder="Enter task title..."
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description (Optional)</label>
              <textarea 
                [(ngModel)]="newTask.description" 
                name="description"
                placeholder="Add a description..."
                rows="3"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Assign To (Optional)</label>
              <select 
                [(ngModel)]="newTask.assignedToId" 
                name="assignedToId"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Unassigned</option>
                <option *ngFor="let user of availableUsers" [value]="user.id">
                  {{ user.username }} ({{ user.role }})
                </option>
              </select>
            </div>
            <div class="flex gap-3">
              <button 
                type="submit" 
                [disabled]="!taskForm.form.valid || isCreating"
                class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
              >
                <span *ngIf="!isCreating" class="flex items-center">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Create Task
                </span>
                <span *ngIf="isCreating" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              </button>
              <button 
                type="button" 
                (click)="cancelCreate()"
                class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-200 dark:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      
        <!-- Loading State -->
        <div class="text-center py-12" *ngIf="isLoading">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-300 font-medium">Loading your tasks...</p>
        </div>
        
        <!-- Error State -->
        <div class="text-center py-12" *ngIf="error">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-red-600 mb-4 font-medium">{{ error }}</p>
          <button (click)="loadTasks()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
            <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Try Again
          </button>
        </div>
      
        <!-- Tasks List -->
        <div *ngIf="!isLoading && !error">
          <!-- Drag and Drop Container -->
          <div 
            cdkDropList
            (cdkDropListDropped)="onDrop($event)"
            class="space-y-4"
            *ngIf="filteredTasks.length > 0"
          >
            <div 
              cdkDrag
              class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-move border border-gray-100 dark:border-gray-700"
              *ngFor="let task of filteredTasks; trackBy: trackByTaskId"
              [class]="task.completed ? 'opacity-75 bg-gray-50 dark:bg-gray-700' : ''"
            >
              <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                         [class]="task.completed ? 'bg-green-100' : 'bg-blue-100'">
                      <svg class="w-4 h-4" [class]="task.completed ? 'text-green-600' : 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path *ngIf="!task.completed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        <path *ngIf="task.completed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">{{ task.title }}</h3>
                      <div class="flex items-center gap-2">
                        <span
                          class="px-3 py-1 rounded-full text-xs font-semibold"
                          [class]="task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                        >
                          {{ task.completed ? 'Completed' : 'Pending' }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ task.organization.name }}</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-gray-600 dark:text-gray-300 text-sm mb-3 ml-11" *ngIf="task.description">{{ task.description }}</p>
                </div>
                       <div class="flex flex-wrap gap-2">
                         <!-- Status Toggle - Only for Owners/Admins -->
                         <button
                           *ngIf="canEditTasks()"
                           (click)="toggleTask(task)"
                           class="px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                           [class]="task.completed
                             ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                             : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'"
                         >
                           <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path *ngIf="!task.completed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                             <path *ngIf="task.completed" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                           </svg>
                           {{ task.completed ? 'Undo' : 'Complete' }}
                         </button>
                         <!-- Edit Button - Only for Owners/Admins -->
                         <button
                           *ngIf="canEditTasks()"
                           (click)="editTask(task)"
                           class="px-4 py-2 text-sm font-semibold bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                         >
                           <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                           </svg>
                           Edit
                         </button>
                         <!-- Delete Button - Only for Owners/Admins -->
                         <button
                           *ngIf="canDeleteTasks()"
                           (click)="deleteTask(task)"
                           class="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                         >
                           <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                           </svg>
                           Delete
                         </button>
                         <!-- Viewer message for read-only access -->
                         <div *ngIf="userInfo?.role === 'Viewer'" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                           Read-only access
                         </div>
                       </div>
              </div>
            </div>
          </div>
        
          <!-- Empty State -->
          <div class="text-center py-12" *ngIf="filteredTasks.length === 0">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tasks found</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Get started by creating your first task!</p>
                   <button 
                     *ngIf="canCreateTasks()" 
                     (click)="showCreateForm = true" 
                     class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                   >
                     <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                     </svg>
                     Create First Task
                   </button>
                   <div *ngIf="!canCreateTasks()" class="text-gray-500 dark:text-gray-400">
                     <p class="mb-2">You don't have permission to create tasks.</p>
                     <p class="text-sm">Contact your administrator for access.</p>
                   </div>
          </div>
        </div>

        <!-- Edit Task Modal -->
        <div *ngIf="showEditForm && editingTask" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h3>
            </div>
            <form (ngSubmit)="updateTask()" #editForm="ngForm" class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Task Title</label>
                <input 
                  type="text" 
                  [(ngModel)]="editingTask.title" 
                  name="editTitle" 
                  required
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
                <textarea 
                  [(ngModel)]="editingTask.description" 
                  name="editDescription"
                  rows="3"
                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                ></textarea>
              </div>
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="editingTask.completed" 
                  name="editCompleted"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                >
                <label class="ml-3 text-sm font-semibold text-gray-900 dark:text-white">Mark as completed</label>
              </div>
              <div class="flex gap-3">
                <button 
                  type="submit" 
                  [disabled]="!editForm.form.valid || isUpdating"
                  class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                >
                  <span *ngIf="!isUpdating" class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Update Task
                  </span>
                  <span *ngIf="isUpdating" class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                </button>
                <button 
                  type="button" 
                  (click)="cancelEdit()"
                  class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl font-semibold transition-all duration-200 border border-gray-200 dark:border-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-8">
          <a (click)="goHome()" class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors duration-200 flex items-center justify-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  isLoading = false;
  error = '';
  userInfo: any = null;
  
  // Form states
  showCreateForm = false;
  showEditForm = false;
  isCreating = false;
  isUpdating = false;
  
  // Filter and sort
  searchTerm = '';
  statusFilter = '';
  sortBy = 'title';
  
  // New task form
  newTask = {
    title: '',
    description: '',
    organizationId: 1,
    assignedToId: '' as string | number
  };
  
  // Edit task form
  editingTask: Task | null = null;
  isDarkMode = false;
  
  // Available users for assignment
  availableUsers: any[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private themeService: ThemeService
  ) {}

  private getErrorMessage(error: any, defaultMessage: string): string {
    if (error.error?.message) {
      if (Array.isArray(error.error.message)) {
        return error.error.message[0];
      } else {
        return error.error.message;
      }
    } else if (error.error?.error) {
      return error.error.error;
    }
    return defaultMessage;
  }

  ngOnInit() {
    this.loadTasks();
    this.loadAvailableUsers();
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  loadTasks() {
    this.isLoading = true;
    this.error = '';
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.get<Task[]>('http://localhost:3000/api/task', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filteredTasks = [...tasks];
        this.isLoading = false;
        // Extract user info from JWT token
        this.userInfo = this.getUserInfoFromToken();
        // Load available users after tasks are loaded
        this.loadAvailableUsers();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.error = this.getErrorMessage(error, 'Failed to load tasks');
        this.isLoading = false;
      }
    });
  }

  loadAvailableUsers() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.get<any[]>('http://localhost:3000/api/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (users) => {
        this.availableUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role?.name || 'Unknown'
        }));
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.availableUsers = [];
      }
    });
  }

  toggleTask(task: Task) {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.put(`http://localhost:3000/api/task/${task.id}`, {
      completed: !task.completed
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        task.completed = !task.completed;
        this.filterTasks(); // Refresh filtered list
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.error = this.getErrorMessage(error, 'Failed to update task');
      }
    });
  }

  // Create Task
  createTask() {
    if (!this.newTask.title.trim()) return;
    
    this.isCreating = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    // Prepare task data, converting empty string to null and string to number for assignedToId
    const taskData = {
      ...this.newTask,
      assignedToId: this.newTask.assignedToId === '' ? null : Number(this.newTask.assignedToId)
    };

    console.log('Sending task data:', taskData);
    console.log('Available users:', this.availableUsers);

    this.http.post('http://localhost:3000/api/task', taskData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        this.newTask = { title: '', description: '', organizationId: 1, assignedToId: '' };
        this.showCreateForm = false;
        this.isCreating = false;
        this.loadTasks(); // Reload tasks
      },
      error: (error) => {
        console.error('Error creating task:', error);
        console.error('Error details:', error.error);
        this.error = this.getErrorMessage(error, 'Failed to create task');
        this.isCreating = false;
      }
    });
  }

  cancelCreate() {
    this.showCreateForm = false;
    this.newTask = { title: '', description: '', organizationId: 1, assignedToId: '' };
  }

  // Edit Task
  editTask(task: Task) {
    this.editingTask = { ...task };
    this.showEditForm = true;
  }

  updateTask() {
    if (!this.editingTask) return;
    
    this.isUpdating = true;
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.put(`http://localhost:3000/api/task/${this.editingTask.id}`, {
      title: this.editingTask.title,
      description: this.editingTask.description,
      completed: this.editingTask.completed
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        // Update the task in the array
        const index = this.tasks.findIndex(t => t.id === this.editingTask!.id);
        if (index !== -1) {
          this.tasks[index] = { ...this.editingTask! };
        }
        this.filterTasks(); // Refresh filtered list
        this.showEditForm = false;
        this.editingTask = null;
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error updating task:', error);
        this.error = this.getErrorMessage(error, 'Failed to update task');
        this.isUpdating = false;
      }
    });
  }

  cancelEdit() {
    this.showEditForm = false;
    this.editingTask = null;
  }

  // Delete Task
  deleteTask(task: Task) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.delete(`http://localhost:3000/api/task/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== task.id);
        this.filterTasks(); // Refresh filtered list
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        this.error = this.getErrorMessage(error, 'Failed to delete task');
      }
    });
  }

  // Filter and Sort
  filterTasks() {
    let filtered = [...this.tasks];

    // Search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(search) ||
        task.description.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(task => {
        if (this.statusFilter === 'completed') return task.completed;
        if (this.statusFilter === 'pending') return !task.completed;
        return true;
      });
    }

    this.filteredTasks = filtered;
    this.sortTasks();
  }

  sortTasks() {
    if (!this.sortBy) return;

    this.filteredTasks.sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.completed === b.completed ? 0 : a.completed ? 1 : -1;
        case 'created':
          return b.id - a.id; // Assuming higher ID = newer
        default:
          return 0;
      }
    });
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  // Drag and Drop
  onDrop(event: CdkDragDrop<Task[]>) {
    if (event.previousIndex !== event.currentIndex) {
      moveItemInArray(this.filteredTasks, event.previousIndex, event.currentIndex);
      // In a real app, you might want to save the new order to the backend
      console.log('Task reordered:', this.filteredTasks.map(t => t.id));
    }
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  // Permission helper methods
  canCreateTasks(): boolean {
    return this.userInfo?.role === 'Owner' || this.userInfo?.role === 'Admin';
  }

  canEditTasks(): boolean {
    return this.userInfo?.role === 'Owner' || this.userInfo?.role === 'Admin';
  }

  canDeleteTasks(): boolean {
    return this.userInfo?.role === 'Owner' || this.userInfo?.role === 'Admin';
  }

  private getUserInfoFromToken(): UserInfo {
    const token = localStorage.getItem('token');
    if (!token) return { username: 'User', role: 'Viewer', userId: 0 };

    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const payload = token.split('.')[1];
      // Decode base64 payload
      const decodedPayload = atob(payload);
      const userData = JSON.parse(decodedPayload);
      // Return user info from the JWT payload
      return {
        username: userData.username || userData.sub || 'User',
        role: userData.role || 'Viewer',
        userId: userData.userId || userData.sub || 0
      };
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return { username: 'User', role: 'Viewer', userId: 0 };
    }
  }
}
