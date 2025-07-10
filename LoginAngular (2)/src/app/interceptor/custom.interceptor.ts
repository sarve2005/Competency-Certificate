import { HttpInterceptorFn } from '@angular/common/http';

export const customInterceptor: HttpInterceptorFn = (req, next) => {
  const userApp = localStorage.getItem('userApp');
  let token: string | null = null;

  if (userApp) {
    const user = JSON.parse(userApp);
    token = user?.employeeDetails?.token || null;
  }

  const clonedReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(clonedReq);
};
