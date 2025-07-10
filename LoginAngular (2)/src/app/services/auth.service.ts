// Create this file: src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TOKEN_KEY } from '../shared/constant';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:7253/api/User';

  constructor(private http: HttpClient) { }

  // Login method
  login(emailId: string, password: string): Observable<any> {
    const loginData = { emailId, password };
    return this.http.post(`${this.apiUrl}/Login`, loginData);
  }


  // Get users (protected endpoint)
  getUsers(): Observable<any> {
    const userAppData = localStorage.getItem('userApp');
    if (!userAppData) throw new Error('No user data found');
    
    const userData = JSON.parse(userAppData);
    const token = userData.token;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.apiUrl}/getUsers`, { headers });
  }

  // Utility methods
  getToken(): string | null {
    const userAppData = localStorage.getItem('userApp');
    if (userAppData) {
      const userData = JSON.parse(userAppData);
      return userData.token;
    }
    return null;
  }

  saveToken(userApp:string){
    localStorage.setItem(TOKEN_KEY, userApp);
  }
  DeleteToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
  

  isLoggedIn(): boolean {
      const tokenDataString = localStorage.getItem("userApp"); // Retrieve token data from localStorage
      if (!tokenDataString) return false; // Ensure token data exists

  const tokenData = JSON.parse(tokenDataString); // Convert string → object
  const type = tokenData.type;     // Access the field
  return true;

}
}