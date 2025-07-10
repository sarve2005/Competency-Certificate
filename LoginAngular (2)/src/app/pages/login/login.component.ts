import { Component, inject, NgModule, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';




@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']

})
export class LoginComponent implements OnInit {
  constructor(
    public service:AuthService
  ) { 

  }
  ngOnInit(): void {
  }
  
  selectedRole: string = 'admin'; // default

  
  LoginObj:any = {
  employeeId : "",
  password : "",
  }
 
  

  selectRole(role: string) {
    this.selectedRole = role;
    console.log('Selected role:', this.selectedRole);
  }

  http = inject(HttpClient);
  router = inject(Router);
onLogin() {
  debugger;
  this.http.post("https://localhost:7269/api/User/Login", this.LoginObj).subscribe({
    next: (res: any) => {
      console.log('Login API response:', res);

      if (res && res.token) {
        // Call GetEmployeeById API and extract 'status'
        this.http.get<any>(`https://localhost:7269/api/User/GetEmployeeById/${this.LoginObj.employeeId}`)
          .subscribe({
            next: (employee: any) => {
              console.log("Employee data:", employee);

              if (employee.status === 2) {
                alert("You are terminated. Login not allowed.");
              } else {
                alert("User Login Successfully");
                this.service.saveToken(JSON.stringify(res));
                this.router.navigateByUrl('/HomeComponent');
              }
            },
            error: (err) => {
              console.error("Error fetching employee status", err);
              alert("Error checking employment status.");
            }
          });
      } else {
        console.error('Unexpected response format:', res);
        alert("Unexpected response from server");
      }
    },
    error: (error) => {
      if (error.status === 400) {
        alert("Invalid Body");
      } else {
        alert("Login failed: " + error.message);
      }
    }
  });
}
}