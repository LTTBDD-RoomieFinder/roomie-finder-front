type TabTarget = "home" | "discover" | "map" | "room" | "requests" | "chats";

type Listener = (target: TabTarget) => void;

let dirty = false;
let listener: Listener | null = null;

export const profileTabGuard = {
  setDirty(value: boolean) {
    dirty = value;
  },
  isDirty() {
    return dirty;
  },
  requestNavigation(target: TabTarget) {
    listener?.(target);
  },
  subscribe(fn: Listener) {
    listener = fn;
    return () => {
      listener = null;
    };
  },
};
