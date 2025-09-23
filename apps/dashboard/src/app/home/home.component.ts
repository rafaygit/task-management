import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <!-- Theme Toggle -->
      <button 
        (click)="toggleTheme()" 
        class="fixed top-4 right-4 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        [class]="isDarkMode ? 'text-yellow-500' : 'text-gray-600'"
      >
        <svg *ngIf="!isDarkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
        <svg *ngIf="isDarkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      </button>

      <div class="max-w-md w-full">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div class="mb-8">
            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Task Manager</h1>
            <p class="text-gray-600 dark:text-gray-300" *ngIf="!isLoggedIn">Organize your tasks efficiently</p>
            <p class="text-gray-600 dark:text-gray-300" *ngIf="isLoggedIn">Welcome back, <span class="font-semibold text-blue-600 dark:text-blue-400">{{ username }}</span>!</p>
          </div>
          
          <div class="space-y-3">
            <button *ngIf="!isLoggedIn" (click)="goToLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Sign In
            </button>
            <button *ngIf="isLoggedIn" (click)="goToTasks()" class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              Go to Tasks
            </button>
            <button *ngIf="!isLoggedIn" (click)="goToTasks()" class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-semibold border border-gray-200 dark:border-gray-600">
              View Tasks
            </button>
            <button *ngIf="isLoggedIn" (click)="logout()" class="w-full bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 px-6 py-3 rounded-lg font-semibold border border-red-200 dark:border-red-700">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  username = '';
  isDarkMode = false;

  constructor(
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.checkAuthStatus();
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }

  checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      this.username = this.getUsernameFromToken();
    } else {
      this.isLoggedIn = false;
      this.username = '';
    }
  }

  private getUsernameFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'User';

    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const payload = token.split('.')[1];
      // Decode base64 payload
      const decodedPayload = atob(payload);
      const userData = JSON.parse(decodedPayload);
      // Return username from the JWT payload
      return userData.username || userData.sub || 'User';
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return 'User';
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToTasks() {
    this.router.navigate(['/tasks']);
  }

  logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    this.username = '';
    // Optionally redirect to login or refresh the page
    this.router.navigate(['/login']);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
