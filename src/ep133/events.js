// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

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
