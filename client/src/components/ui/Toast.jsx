import { useToast } from '../../context/ToastContext';

const typeStyles = {
  success: 'bg-tertiary text-on-tertiary',
  error: 'bg-error text-on-error',
  info: 'bg-primary text-on-primary',
};

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 font-display text-xs uppercase tracking-widest ${typeStyles[toast.type] || typeStyles.info}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
