import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '../app/store';
import {
  register as registerThunk,
  login as loginThunk,
  logout as logoutThunk,
  fetchCurrentUser,
  verifyEmail as verifyEmailThunk,
  forgotPassword as forgotPasswordThunk,
  resetPassword as resetPasswordThunk,
  clearError,
  updateUser,
} from '../features/auth/authSlice';
import type { User, RegisterInput, LoginInput, VerifyEmailInput, ForgotPasswordInput, ResetPasswordInput } from '../types/user';

/**
 * Custom hook wrapping Redux auth state and actions.
 * Provides a clean API for auth-related operations.
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const register = useCallback(
    (input: RegisterInput) => dispatch(registerThunk(input)).unwrap(),
    [dispatch]
  );

  const login = useCallback(
    (input: LoginInput) => dispatch(loginThunk(input)).unwrap(),
    [dispatch]
  );

  const logout = useCallback(
    () => dispatch(logoutThunk()),
    [dispatch]
  );

  const fetchUser = useCallback(
    () => dispatch(fetchCurrentUser()),
    [dispatch]
  );

  const verifyEmail = useCallback(
    (input: VerifyEmailInput) => dispatch(verifyEmailThunk(input)).unwrap(),
    [dispatch]
  );

  const forgotPassword = useCallback(
    (input: ForgotPasswordInput) => dispatch(forgotPasswordThunk(input)).unwrap(),
    [dispatch]
  );

  const resetPassword = useCallback(
    (input: ResetPasswordInput) => dispatch(resetPasswordThunk(input)).unwrap(),
    [dispatch]
  );

  const clearAuthError = useCallback(
    () => dispatch(clearError()),
    [dispatch]
  );

  const updateProfile = useCallback(
    (data: Partial<User>) => dispatch(updateUser(data)),
    [dispatch]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    fetchUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    clearAuthError,
    updateProfile,
  };
}
