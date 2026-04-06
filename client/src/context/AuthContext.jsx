import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext(null);

const initialState = {
  token: null,
  user: null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        token: action.payload.token,
        user: action.payload.user,
        isLoading: false,
      };
    case 'LOGOUT':
      return { token: null, user: null, isLoading: false };
    case 'LOADED':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('jb_token');
    const userJson = localStorage.getItem('jb_user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        dispatch({ type: 'LOGIN', payload: { token, user } });
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem('jb_token');
        localStorage.removeItem('jb_user');
        dispatch({ type: 'LOADED' });
      }
    } else {
      // No stored auth, require login
      dispatch({ type: 'LOADED' });
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('jb_token', token);
    localStorage.setItem('jb_user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { token, user } });
  };

  const logout = () => {
    localStorage.removeItem('jb_token');
    localStorage.removeItem('jb_user');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    token: state.token,
    user: state.user,
    isAuthenticated: state.token != null,
    isLoading: state.isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
