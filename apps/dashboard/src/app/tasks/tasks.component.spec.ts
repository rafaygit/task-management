import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { TasksComponent } from './tasks.component';
import { ThemeService } from '../services/theme.service';
import { of } from 'rxjs';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let httpMock: HttpTestingController;

  const mockTasks = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Description 1',
      completed: false,
      assignedTo: { id: 1, username: 'user1' },
      organization: { id: 1, name: 'Test Org' }
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Description 2',
      completed: true,
      assignedTo: { id: 2, username: 'user2' },
      organization: { id: 1, name: 'Test Org' }
    }
  ];

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoxLCJyb2xlIjoiT3duZXIiLCJ1c2VySWQiOjEsIm9yZ0lkIjoxLCJpYXQiOjE2MzQ1Njc4OTAsImV4cCI6MTYzNDU3MTQ5MH0.test';

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      isDarkMode$: of(false)
    });

    await TestBed.configureTestingModule({
      imports: [TasksComponent, HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockThemeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  beforeEach(() => {
    localStorage.setItem('token', mockToken);
  });

  afterEach(() => {
    localStorage.clear();
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    component.ngOnInit();

    const req = httpMock.expectOne('http://localhost:3000/api/task');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockTasks);

    expect(component.tasks).toEqual(mockTasks);
    expect(component.filteredTasks).toEqual(mockTasks);
    expect(component.isLoading).toBe(false);
  });

  it('should redirect to login if no token', () => {
    localStorage.removeItem('token');
    component.ngOnInit();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle load tasks error', () => {
    component.ngOnInit();

    const req = httpMock.expectOne('http://localhost:3000/api/task');
    req.flush({ error: { message: 'Server error' } }, { status: 500, statusText: 'Server Error' });

    expect(component.error).toBe('Failed to load tasks');
    expect(component.isLoading).toBe(false);
  });

  it('should toggle task completion', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks];
    const task = mockTasks[0];

    component.toggleTask(task);

    const req = httpMock.expectOne(`http://localhost:3000/api/task/${task.id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ completed: true });
    req.flush({ ...task, completed: true });

    expect(task.completed).toBe(true);
  });

  it('should create new task', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks]; // Initialize filteredTasks
    component.newTask = {
      title: 'New Task',
      description: 'New Description',
      organizationId: 1
    };

    component.createTask();

    const createReq = httpMock.expectOne('http://localhost:3000/api/task');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual(component.newTask);
    createReq.flush({ id: 3, ...component.newTask, completed: false });

    // Flush the loadTasks() request that happens after createTask()
    const loadReq = httpMock.expectOne('http://localhost:3000/api/task');
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush(mockTasks);

    expect(component.showCreateForm).toBe(false);
    expect(component.newTask.title).toBe('');
  });

  it('should edit task', () => {
    const task = mockTasks[0];
    component.editTask(task);

    expect(component.editingTask).toEqual({ ...task });
    expect(component.showEditForm).toBe(true);
  });

  it('should update task', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks];
    component.editingTask = { ...mockTasks[0], title: 'Updated Task' };

    component.updateTask();

    const req = httpMock.expectOne(`http://localhost:3000/api/task/${component.editingTask.id}`);
    expect(req.request.method).toBe('PUT');
    req.flush(component.editingTask);

    expect(component.showEditForm).toBe(false);
    expect(component.editingTask).toBeNull();
  });

  it('should delete task', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks];
    const task = mockTasks[0];
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    component.deleteTask(task);

    const req = httpMock.expectOne(`http://localhost:3000/api/task/${task.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(component.tasks).not.toContain(task);
  });

  it('should filter tasks by search term', () => {
    component.tasks = [...mockTasks];
    component.searchTerm = 'Task 1';

    component.filterTasks();

    expect(component.filteredTasks).toEqual([mockTasks[0]]);
  });

  it('should filter tasks by status', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks]; // Initialize filteredTasks
    component.statusFilter = 'completed';

    component.filterTasks();

    expect(component.filteredTasks).toEqual([mockTasks[1]]);
  });

  it('should sort tasks by title', () => {
    component.tasks = [...mockTasks];
    component.filteredTasks = [...mockTasks]; // Initialize filteredTasks
    component.sortBy = 'title';

    component.sortTasks();

    expect(component.filteredTasks[0].title).toBe('Test Task 1');
    expect(component.filteredTasks[1].title).toBe('Test Task 2');
  });

  it('should check permissions correctly', () => {
    component.userInfo = { username: 'testuser', role: 'Owner', userId: 1 };

    expect(component.canCreateTasks()).toBe(true);
    expect(component.canEditTasks()).toBe(true);
    expect(component.canDeleteTasks()).toBe(true);

    component.userInfo.role = 'Admin';
    expect(component.canCreateTasks()).toBe(true);
    expect(component.canEditTasks()).toBe(true);
    expect(component.canDeleteTasks()).toBe(true);

    component.userInfo.role = 'Viewer';
    expect(component.canCreateTasks()).toBe(false);
    expect(component.canEditTasks()).toBe(false);
    expect(component.canDeleteTasks()).toBe(false);
  });

  it('should logout and clear token', () => {
    component.logout();
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should toggle theme', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalled();
  });
});
