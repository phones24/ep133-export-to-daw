export const eventEmitter = {
  add: (eventName, id, handler) => {
    const fullEventName = `${eventName}[${id}]`;
    document.addEventListener(fullEventName, handler, true);
  },

  remove: (eventName, id, handler) => {
    const fullEventName = `${eventName}[${id}]`;
    document.removeEventListener(fullEventName, handler, true);
  },

  dispatch: (eventName, id, detail) => {
    const fullEventName = `${eventName}[${id}]`;
    document.dispatchEvent(
      new CustomEvent(fullEventName, {
        detail: detail,
      }),
    );
  },
};
