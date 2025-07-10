import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {

  constructor(private http: HttpClient, private router: Router,private authService: AuthService,private cdr: ChangeDetectorRef) {}
employeeData: any = {
  employee_id: "",
  employee_name: "",
  PhotoBase64: "",
  employee_type: 1,
  categoryName: 0,
  contractorName: null,
  dob: "2025-06-28",
  epF_UAN_NO: "",
  esA_NO: "",
  bankName: "",
  bankAccountNumber: "",
  passbookBase64: "",
  joiningDate: "2025-06-28",
  designation_Name: "",
  departmentName: "",
  subDepartmentName: null,
  aadharNo: "",
  bloodGroup: "",
  contactNo: "",
  emerContactNo: "",
  status: 0
}
department:any[]=[];
designation:any[]=[];
subdepartment:any[]=[];
contractors:any[]=[];
emplogin: any = {};
ngOnInit(): void {
 this.fetchDepartment();
 this.fetchContractors();
this.getDesignation("NonExecutive")
 // Remove the fetchSubDepartment call from here since DepartmentName is null
}
fetchContractors(): void {
  this.http.get("https://localhost:7269/api/User/GetAllContractors").subscribe((data:any)=>{
    this.contractors = data;
    console.log('Contractors data fetched:', this.contractors);
  });
}
fetchDepartment():void{
  this.http.get("https://localhost:7269/api/User/GetAllDepartments").subscribe((data:any)=>{
    this.department = data;
  });
}


fetchSubDepartment(departmentName: string): void {
  // Clear subdepartments first
  this.subdepartment = [];
  
  if (!departmentName || departmentName === '' || departmentName === 'null') {
    console.log('No valid department selected');
    return;
  }
  
  console.log('Fetching subdepartments for department:', departmentName);
  
  // Try the exact URL format that worked in your test
  const url = `https://localhost:7269/api/User/GetSbDepartmentsByDepartmentId/${encodeURIComponent(departmentName)}`;
  console.log('API URL:', url);
  
  this.http.get(url).subscribe({
    next: (data: any) => {
      console.log('Subdepartment API Response:', data);
      if (Array.isArray(data)) {
        this.subdepartment = data;
        console.log('Subdepartment array set:', this.subdepartment);
      } else {
        console.error('API did not return an array:', data);
        this.subdepartment = [];
      }
    },
    error: (error) => {
      console.error('Error fetching subdepartments:', error);
      console.error('Status:', error.status);
      console.error('URL that failed:', url);
      this.subdepartment = [];
    }
  });
}

// Add this method to handle department selection changes
onDepartmentChange(): void {
  console.log('Department changed to:', this.employeeData.departmentName);
  console.log('Type of department value:', typeof this.employeeData.departmentName);
  
  // Reset subdepartment when department changes
  this.employeeData.subDepartmentName = null;

  // Add a small delay to ensure the value is properly set
  setTimeout(() => {
    this.fetchSubDepartment(this.employeeData.departmentName);
  }, 100);
}

onEmployeeTypeChange(): void {
  const empType = this.employeeData.employee_type;

  // If Executive is selected, force CMRL (0)
  if (empType === 0) {
    this.employeeData.categoryName = 0;
  }

  // If Non-Executive is selected and CMRL is selected, keep it or allow toggle
  if (empType === 1 && this.employeeData.categoryName === 0) {
    // Allow to stay as CMRL or switch manually
  }

  // If Executive and Non-CMRL is selected by manipulation, fix it
  if (empType === 0 && this.employeeData.categoryName === 1) {
    this.employeeData.categoryName = 0;
  }

  // If Non-Executive and both are disabled (rare), default to Non-CMRL
  if (empType === 1 && (this.employeeData.categoryName !== 0 && this.employeeData.categoryName !== 1)) {
    this.employeeData.categoryName = 1;
  }
  if(empType === 0){
    this.getDesignation("Executive");
  }
  else{
    this.getDesignation("NonExecutive")
  }
}
getDesignation(type:string){
  this.http.get(`https://localhost:7269/api/User/GetDesignationByType/${encodeURIComponent(type)}`).subscribe({
    next:(data:any)=>{
      this.designation = data;
      console.log("Designation of ",type,"is : ",this.designation);
    }
  })
}
passbookFileName: string = '';

onPassbookUpload(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // Validate file type (strict check for PDF)
  if (file.type !== 'application/pdf') {
    alert('Only PDF files are allowed.');
    input.value = ''; // Reset input
    return;
  }

  // Validate file size (Max 5 MB)
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    alert(`File size exceeds ${maxSizeMB} MB.`);
    input.value = ''; // Reset input
    return;
  }

  this.passbookFileName = file.name;

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    const base64 = result.split(',')[1];

   this.employeeData.passbookBase64 = base64;

    console.log('✅ File selected:', file.name);
    console.log('📄 Base64 string stored in employeeData.passbookBase64');
    console.log('📄 Base64 string length:', base64);
  };

  reader.readAsDataURL(file);
}

submitForm() {
  const validationErrors = this.validateNumericFields();

  if (validationErrors.length > 0) {
    alert('❌ Please fix the following errors:\n\n' + validationErrors.join('\n'));
    return;
  }
  console.log('Submitting employee data:', this.employeeData);

  this.http.post("https://localhost:7269/api/User/AddEmployee", this.employeeData).subscribe({
    next: (response) => {
      console.log('Employee registered successfully:', response);

      this.emplogin = {
        employee_id: this.employeeData.employee_id,
        Password: "CMRL" + this.getDesignationCode(this.employeeData.designation_Name) + this.employeeData.dob.replace(/-/g, '').slice(0, 6)
      };

      console.log('Employee login data:', this.emplogin);

      if (this.employeeData.employee_type === 0) {
        this.http.post("https://localhost:7269/api/User/AddEmployeeLogin", this.emplogin).subscribe({
          next: (loginResponse) => {
            alert("✅ Employee and login created successfully!");
            location.reload();
          },
          error: (loginError) => {
            this.showErrorMessages(loginError);
          }
        });
      } else {
        alert("✅ Employee created successfully!");
        location.reload();
      }
    },
    error: (error) => {
      this.showErrorMessages(error);
    }
  });
}


showErrorMessages(error: any): void {
  if (error?.error?.errors) {
    // Validation errors (from model validation attributes like [Required])
    const errorObj = error.error.errors;
    let messages: string[] = [];

    for (const key in errorObj) {
      if (errorObj.hasOwnProperty(key)) {
        messages.push(errorObj[key]);
      }
    }

    alert("❌ Please fix the following errors:\n\n" + messages.join('\n'));

  } else if (error?.error?.message) {
    // Custom error message from API (like "Photo is required.")
    alert("❌ " + error.error.message);

  } else {
    // Fallback for unknown error formats
    alert("❌ An unexpected error occurred:\n" + (error.message || 'Unknown error'));
  }
}




getDesignationCode(designation: string): string {
  const found = this.designation.find(item =>
    item.designation_Name?.trim().toLowerCase() === designation?.trim().toLowerCase()
  );
  if (found) {
    console.log('Designation code:', found.designationCode);
    return found.designationCode;
  }
  return '';
}

isHOD(): boolean {
  return ((this.employeeData.designation_Name?.toLowerCase() === "agm") || (this.employeeData.designation_Name?.toLowerCase() === "gm") || (this.employeeData.designation_Name?.toLowerCase() === "cgm") || (this.employeeData.designation_Name?.toLowerCase() === "advisor"));
}
employeePhotoFileName: string = '';
validateNumericFields(): string[] {
  const errors: string[] = [];

  const aadhar = (this.employeeData.aadharNo || '').trim();
  if (!/^\d{12}$/.test(aadhar)) {
    errors.push('Aadhar Number must be exactly 8 digits.');
  }

  const contact = (this.employeeData.contactNo || '').trim();
  if (!/^\d{10}$/.test(contact)) {
    errors.push('Contact Number must be exactly 10 digits.');
  }

  const emerContact = (this.employeeData.emerContactNo || '').trim();
  if (!/^\d{10}$/.test(emerContact)) {
    errors.push('Emergency Contact must be exactly 10 digits.');
  }

  const epf = (this.employeeData.epF_UAN_NO || '').trim();
  if (!/^\d{12}$/.test(epf)) {
    errors.push('EPF UAN Number must be exactly 12 digits.');
  }

  const esi = (this.employeeData.esA_NO || '').trim();
  if (!/^\d{17}$/.test(esi)) {
    errors.push('ESI Number must be exactly 17 digits.');
  }

  const bankAcc = (this.employeeData.bankAccountNumber || '').trim();
  if (!/^\d{12}$/.test(bankAcc)) {
    errors.push('Bank Account Number must be exactly 12 digits.');
  }

  return errors;
}

onPhotoUpload(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // ✅ Validate image type
  if (!file.type.startsWith('image/')) {
    alert('Only image files (JPG, PNG, etc.) are allowed.');
    input.value = '';
    return;
  }

  // ✅ Validate size (2 MB max)
  const maxSizeMB = 2;
  if (file.size > maxSizeMB * 1024 * 1024) {
    alert(`Image size exceeds ${maxSizeMB} MB.`);
    input.value = '';
    return;
  }

  this.employeePhotoFileName = file.name;

  const reader = new FileReader();
  reader.onload = () => {
    const base64String = (reader.result as string).split(',')[1];
    
    // ⚠️ Still stored as base64 string (conversion happens in backend)
    this.employeeData.PhotoBase64 = base64String;

    console.log('✅ Photo selected:', this.employeePhotoFileName);
    console.log('📸 Base64 string stored in employeeData.PhotoBase64');
    console.log('📸 Base64 length:', base64String);
  };

  reader.readAsDataURL(file);
}
goHome(): void {
    console.log('Navigate to Home');
    this.router.navigateByUrl('/HomeComponent');
  }
logout(): void {
    this.authService.DeleteToken();
    this.router.navigateByUrl('/login');
  }
}