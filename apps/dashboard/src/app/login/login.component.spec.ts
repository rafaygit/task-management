import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { ThemeService } from '../services/theme.service';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear();
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockThemeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.credentials.username).toBe('');
    expect(component.credentials.password).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('should subscribe to theme changes on init', () => {
    spyOn(mockThemeService.isDarkMode$, 'subscribe');
    component.ngOnInit();
    expect(mockThemeService.isDarkMode$.subscribe).toHaveBeenCalled();
  });

  it('should handle successful login', () => {
    const mockResponse = { access_token: 'mock-jwt-token' };
    component.credentials = { username: 'testuser', password: 'password' };

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(component.credentials);
    req.flush(mockResponse);

    expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
    expect(component.isLoading).toBe(false);
  });

  it('should handle login error', () => {
    const mockError = { error: { message: 'Invalid credentials' } };
    component.credentials = { username: 'testuser', password: 'wrongpassword' };

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.flush(mockError, { status: 401, statusText: 'Unauthorized' });

    expect(component.error).toBe('Login failed. Please check your credentials.');
    expect(component.isLoading).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle network error', () => {
    component.credentials = { username: 'testuser', password: 'password' };

    component.onSubmit();

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.error(new ErrorEvent('Network error'));

    expect(component.error).toBe('Login failed. Please check your credentials.');
    expect(component.isLoading).toBe(false);
  });

  it('should navigate to home', () => {
    component.goHome();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should toggle theme', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });

  it('should set loading state during login', () => {
    component.credentials = { username: 'testuser', password: 'password' };
    
    component.onSubmit();
    
    expect(component.isLoading).toBe(true);
    expect(component.error).toBe('');
    
    // Flush the request to complete the test
    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    req.flush({ access_token: 'mock-jwt-token' });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
