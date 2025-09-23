import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { ThemeService } from '../services/theme.service';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockThemeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with logged out state', () => {
    component.ngOnInit();
    expect(component.isLoggedIn).toBe(false);
    expect(component.username).toBe('');
  });

  it('should detect logged in state from localStorage', () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoxLCJyb2xlIjoiT3duZXIiLCJ1c2VySWQiOjEsIm9yZ0lkIjoxLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.test';
    localStorage.setItem('token', mockToken);
    
    component.ngOnInit();
    
    expect(component.isLoggedIn).toBe(true);
    expect(component.username).toBe('testuser');
  });

  it('should handle invalid JWT token gracefully', () => {
    localStorage.setItem('token', 'invalid-token');
    
    component.ngOnInit();
    
    expect(component.isLoggedIn).toBe(true);
    expect(component.username).toBe('User');
  });

  it('should navigate to login page', () => {
    component.goToLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should navigate to tasks page', () => {
    component.goToTasks();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('should logout and clear token', () => {
    localStorage.setItem('token', 'test-token');
    component.isLoggedIn = true;
    component.username = 'testuser';
    
    component.logout();
    
    expect(localStorage.getItem('token')).toBeNull();
    expect(component.isLoggedIn).toBe(false);
    expect(component.username).toBe('');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should toggle theme', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should subscribe to theme changes', () => {
    spyOn(mockThemeService.isDarkMode$, 'subscribe');
    component.ngOnInit();
    expect(mockThemeService.isDarkMode$.subscribe).toHaveBeenCalled();
  });
});
