export const toastEvent = new EventTarget();
export const showToast = (message, type = 'error') => {
  toastEvent.dispatchEvent(new CustomEvent('toast', { detail: { message, type } }));
};
