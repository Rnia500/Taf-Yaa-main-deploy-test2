import React from 'react';
import useToastStore from '../../store/useToastStore';
import '../../styles/Toast.css';

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  const getToastClass = (type) => {
    switch (type) {
      case 'success': return 'toast toast-success';
      case 'error': return 'toast toast-error';
      case 'warning': return 'toast toast-warning';
      case 'info': return 'toast toast-info';
      case 'blank': return 'toast toast-blank'; 
      default: return 'toast';
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastClass(toast.type)} toast-animation`}
          onClick={() => removeToast(toast.id)}
        >
          {toast.content ? toast.content : toast.message}
        </div>
      ))}
    </div>
  );
};

export default Toast;
