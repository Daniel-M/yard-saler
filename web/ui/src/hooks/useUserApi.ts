import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export interface UserPreRegisterDTO {
  email: string;
  password?: string;
}

export interface UserVerifyDTO {
  email?: string;
  verificationCode: string;
}

export interface UserDTO {
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  socials?: string[];
}

export interface UserPasswordResetDTO {
  passwordChangeCode: string;
  password?: string;
}

export const useUserApi = () => {
  const context = useContext(AuthContext);
  const token = context ? context.token : localStorage.getItem('paseto_token');
  
  const request = async (endpoint: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Fallback to default message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    try {
      return await response.json();
    } catch (e) {
      // Return null or empty if JSON is invalid/empty but status was ok
      return null;
    }
  };

  const preRegister = async (data: UserPreRegisterDTO) => {
    return request('/user/pre-register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const verify = async (data: UserVerifyDTO) => {
    return request('/user/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const editDetails = async (data: UserDTO) => {
    return request('/user/edit-details', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const passwordReset = async (data: UserPasswordResetDTO) => {
    return request('/user/password-reset', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return {
    preRegister,
    verify,
    editDetails,
    passwordReset,
  };
};
