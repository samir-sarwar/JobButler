import { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload];
    case 'DISMISS':
      return state.filter((t) => t.id !== action.payload);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    dispatch({ type: 'ADD', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'DISMISS', payload: id }), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    dispatch({ type: 'DISMISS', payload: id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
