import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Employee {
  employee_id: string;
  employee_name: string;
  employee_type?: number;
  categoryName?: number;
  contractorName?: string;
}

@Component({
  selector: 'app-certificate-initiate',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './certificate-initiate.component.html',
  styleUrl: './certificate-initiate.component.css'
})
export class CertificateInitiateComponent implements OnInit {
  
  // Employee data
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  searchQuery: string = '';
  isSideMenuOpen: boolean = false;
  
  // Modal properties
  showConfirmationModal = false;
  confirmationMessage = '';
  selectedEmployee: Employee | null = null;

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {}

  // Get initiated employee IDs from localStorage
  private getInitiatedEmployeeIds(): string[] {
    const initiatedEmployeesJson = localStorage.getItem('initiatedEmployees');
    const initiatedIds = initiatedEmployeesJson ? JSON.parse(initiatedEmployeesJson) : [];
    console.log('Initiated employee IDs from localStorage:', initiatedIds);
    return initiatedIds;
  }

  // Save initiated employee ID to localStorage
  private saveInitiatedEmployeeId(employeeId: string): void {
    const initiatedEmployeeIds = this.getInitiatedEmployeeIds();
    if (!initiatedEmployeeIds.includes(employeeId)) {
      initiatedEmployeeIds.push(employeeId);
      localStorage.setItem('initiatedEmployees', JSON.stringify(initiatedEmployeeIds));
      console.log('Saved initiated employee ID:', employeeId);
    }
  }

  fetchSubDepartmentEmployees(subDepartment: string): void {
    const encodedSubDepartment = encodeURIComponent(subDepartment);
    
    this.http.get<Employee[]>(`https://localhost:7269/api/User/GetEmployeesBySubDepartmentName/${encodedSubDepartment}`).subscribe({
      next: (data) => {
        console.log('Fetched employees:', data);
        
        // Get list of initiated employee IDs from localStorage
        const initiatedEmployeeIds = this.getInitiatedEmployeeIds();
        console.log('Checking against initiated IDs:', initiatedEmployeeIds);
        
        // Filter out employees who are already initiated
        this.employees = data.filter(employee => {
          const isInitiated = initiatedEmployeeIds.includes(employee.employee_id);
          const isexecutive = employee.employee_type === 0; // Assuming 0 is the type for executives
          console.log(`Employee ${employee.employee_id} (${employee.employee_name}) - Already initiated: ${isInitiated}`);
          return !(isInitiated || isexecutive);
        });
        
        this.filteredEmployees = [...this.employees];
        console.log('Final filtered employees:', this.employees);
        console.log('Employees available for initialization:', this.employees.length);
        
        // If no employees are available, log the reason
        if (this.employees.length === 0 && data.length > 0) {
          console.warn('All employees from this sub-department have already been initiated');
        }
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
      }
    });
  }

  ngOnInit(): void {
    const loggedData = localStorage.getItem('userApp');

    if (loggedData) {
      const userData = JSON.parse(loggedData);
      const subDepartment = userData?.employeeDetails?.subDepartmentName;

      if (subDepartment) {
        console.log('Fetching employees for subDepartment:', subDepartment);
        this.fetchSubDepartmentEmployees(subDepartment);
      } else {
        console.warn('SubDepartment name is missing');
      }
    } else {
      console.warn('User not logged in or userApp missing from localStorage');
    }
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredEmployees = [...this.employees];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredEmployees = this.employees.filter(employee => 
        employee.employee_name.toLowerCase().includes(query) ||
        employee.employee_id.toLowerCase().includes(query)
      );
    }
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.filteredEmployees = [...this.employees];
  }

  // Initialize employee with custom modal
  initializeEmployee(employee: Employee): void {
    console.log('Initializing employee:', employee);
    
    // Set up modal
    this.selectedEmployee = employee;
    this.confirmationMessage = `Confirm to initialize ${employee.employee_name} (${employee.employee_id})?`;
    this.showConfirmationModal = true;
  }

  // Handle modal confirmation
  onConfirmationResult(confirmed: boolean): void {
    this.showConfirmationModal = false;
    
    if (confirmed && this.selectedEmployee) {
      // User clicked Yes - proceed with initialization
      this.addInitiateToDatabase(this.selectedEmployee);
    } else {
      // User clicked No or closed modal - do nothing
      console.log('Initialization cancelled by user');
    }
    
    this.selectedEmployee = null;
  }

  // Add employee to database
  addInitiateToDatabase(employee: Employee): void {
    const initializeDto = {
      employee_id: employee.employee_id
    };

    this.http.post('https://localhost:7269/api/User/AddInitiate', initializeDto).subscribe({
      next: (response: any) => {
        console.log('Employee initialized successfully:', response);
        alert(`${employee.employee_name} has been initialized successfully!`);
        
        // Save the initiated employee ID to localStorage
        this.saveInitiatedEmployeeId(employee.employee_id);
        
        // Remove the employee from both arrays after successful initialization
        this.removeEmployeeFromLists(employee.employee_id);
      },
      error: (error) => {
        console.error('Error initializing employee:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);
        
        if (error.status === 400 && error.error?.message) {
          // Check if the error is about employee already being initiated
          if (error.error.message.includes('already initiated') || 
              error.error.message.includes('Employee is already initiated')) {
            alert(`${employee.employee_name} is already initiated.`);
            
            // Save to localStorage and remove from frontend lists
            this.saveInitiatedEmployeeId(employee.employee_id);
            this.removeEmployeeFromLists(employee.employee_id);
          } else {
            alert(`Error: ${error.error.message}`);
          }
        } else if (error.status === 404) {
          alert('Error: API endpoint not found. Please check the URL.');
        } else {
          alert('An error occurred while initializing the employee.');
        }
      }
    });
  }

  // Remove employee from both employees and filteredEmployees arrays
  removeEmployeeFromLists(employeeId: string): void {
    // Remove from main employees array
    this.employees = this.employees.filter(emp => emp.employee_id !== employeeId);
    
    // Remove from filtered employees array (what's displayed)
    this.filteredEmployees = this.filteredEmployees.filter(emp => emp.employee_id !== employeeId);
    
    console.log(`Employee ${employeeId} removed from frontend lists`);
  }

  // Toggle side menu
  toggleSideMenu(): void {
    this.isSideMenuOpen = !this.isSideMenuOpen;
  }

  // Close side menu
  closeSideMenu(): void {
    this.isSideMenuOpen = false;
  }

  // Navigation methods
  goHome(): void {
    console.log('Navigate to Home');
    this.router.navigateByUrl('/HomeComponent');
  }

  viewProfile(): void {
    console.log('Navigate to View Profile');
  }

  logout(): void {
    this.authService.DeleteToken();
    this.router.navigateByUrl('/login');
  }
  // Helper method for getting employee initials
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Track by function
  trackByEmployeeId(index: number, employee: Employee): string {
    return employee.employee_id;
  }

  // Method to clear all initiated employees from localStorage (for testing/debugging)
  clearInitiatedEmployees(): void {
    localStorage.removeItem('initiatedEmployees');
    console.log('Cleared all initiated employees from localStorage');
    // Refresh the employee list after clearing
    this.ngOnInit();
  }

  // Method to check what's in localStorage (for debugging)
  checkLocalStorageContents(): void {
    const initiatedEmployees = localStorage.getItem('initiatedEmployees');
    console.log('Current localStorage contents for initiatedEmployees:', initiatedEmployees);
  }
}