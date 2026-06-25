import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authenticate } from '@/config/credentials';
import { appText } from '@/config/constants';
import { AuthenticatedUser, LoginCredentials, LoginStatus } from '@/types';

const STORAGE_KEY = 'overtime-portal.auth';

const loadPersistedUser = (): AuthenticatedUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
};

const persistUser = (user: AuthenticatedUser | null): void => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage may be unavailable (private mode) — fail silently */
  }
};

interface AuthState {
  user: AuthenticatedUser | null;
  status: LoginStatus;
  error: string | null;
}

const persistedUser = loadPersistedUser();

const initialState: AuthState = {
  user: persistedUser,
  status: persistedUser ? 'authenticated' : 'idle',
  error: null,
};

/**
 * Simulates an async SSO/LDAP round-trip. Resolves with the user on success
 * and rejects with a user-facing message on failure.
 */
export const login = createAsyncThunk<
  AuthenticatedUser,
  LoginCredentials,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const user = authenticate(credentials);
  if (!user) {
    return rejectWithValue(appText.login.invalidCredentials);
  }
  return user;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      persistUser(null);
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'submitting';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthenticatedUser>) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.error = null;
        persistUser(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.user = null;
        state.status = 'error';
        state.error = action.payload ?? appText.login.invalidCredentials;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
