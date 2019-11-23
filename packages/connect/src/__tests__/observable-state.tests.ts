import Store from "../store";
import {
  Derived,
  StoreType,
  ObservableState,
  StoreOptions,
  Context
} from "../../types";
import { OWNER, PATH, RAW, ROOT, OBSERVABLE_STATE } from "../symbols";

interface MyStore extends StoreType {
  state: {
    users: { profile: { name: string; surname: string } }[];
    usersLength: Derived<MyStore, number>;
    userName: Derived<MyStore, number, string>;
    userProp: Derived<MyStore, number, string, string>;
  };
  libraries: {
    capitalize: (str: string) => string;
  };
}

let rawStore: MyStore;
let store: Store<MyStore>;
let state: ObservableState<MyStore>;

beforeEach(() => {
  rawStore = {
    state: {
      users: [
        { profile: { name: "Jon", surname: "Snow" } },
        { profile: { name: "Jammie", surname: "Lannister" } }
      ],
      usersLength: ({ state }) => state.users.length,
      userName: ({ state }) => index => state.users[index].profile.name,
      userProp: ({ state, libraries }) => (index, prop) =>
        libraries.capitalize(state.users[index].profile[prop])
    },
    actions: {},
    libraries: {
      capitalize: str => str.toUpperCase()
    }
  };
  store = new Store(rawStore);
  state = store.createObservableState();
});

describe("observableState", () => {
  it("should return an observable state", () => {
    expect(state[OBSERVABLE_STATE]).toBe(true);
    expect(state).toBeInstanceOf(Proxy);
    expect(state.users[OBSERVABLE_STATE]).toBe(true);
    expect(state.users).toBeInstanceOf(Proxy);
    expect(state.users[0][OBSERVABLE_STATE]).toBe(true);
    expect(state.users[0]).toBeInstanceOf(Proxy);
    expect(state.users[0].profile[OBSERVABLE_STATE]).toBe(true);
    expect(state.users[0].profile).toBeInstanceOf(Proxy);
  });

  it("should return the own keys of the raw state", () => {
    expect(Object.keys(state)).toEqual([
      "users",
      "usersLength",
      "userName",
      "userProp"
    ]);
    expect(Object.keys(state.users[0].profile)).toBe(["name", "surname"]);
  });

  it("should store the path of each part of the state", () => {
    expect(state[PATH]).toBe("state");
    expect(state.users[PATH]).toBe("state.users");
    expect(state.users[0][PATH]).toBe("state.users.0");
    expect(state.users[0].profile[PATH]).toBe("state.users.0.profile");
  });

  it("should store access to the raw state to each part of the observable state", () => {
    expect(state[RAW]).toBe(rawStore.state);
    expect(state.users[RAW]).toBe(rawStore.state.users);
    expect(state.users[0][RAW]).toBe(rawStore.state.users[0]);
    expect(state.users[0].profile[RAW]).toBe(rawStore.state.users[0].profile);
  });

  it("should store access to the root observable state and libraries", () => {
    expect(state[ROOT].state).toBe(state);
    expect(state[ROOT].libraries).toBe(rawStore.libraries);
    expect(state.users[ROOT].state).toBe(state);
    expect(state.users[ROOT].libraries).toBe(rawStore.libraries);
    expect(state.users[0][ROOT].state).toBe(state);
    expect(state.users[0][ROOT].libraries).toBe(rawStore.libraries);
    expect(state.users[0].profile[ROOT].state).toBe(state);
    expect(state.users[0].profile[ROOT].libraries).toBe(rawStore.libraries);
  });

  it("should not have access to the root actions", () => {
    expect(state[ROOT].actions).toBe(undefined);
    expect(state.users[ROOT].actions).toBe(undefined);
    expect(state.users[0][ROOT].actions).toBe(undefined);
    expect(state.users[0].profile[ROOT].actions).toBe(undefined);
  });

  it("should run the derived state functions using the root store as argument", () => {
    expect(state.usersLength).toBe(2);
    expect(state.userName(0)).toBe("Jon");
    expect(state.userProp(0, "surname")).toBe("SNOW");
  });

  it("should return the primitive values of the raw state", () => {
    expect(state.users[0].profile.name).toBe("Jon");
    expect(state.users[0].profile.surname).toBe("Snow");
  });
});

describe("observableState Owner", () => {
  it("should return different observable states and store different owner in development", () => {
    const options1: StoreOptions = {
      mode: "development"
    };
    const options2: StoreOptions = {
      mode: "development"
    };
    const context1: Context = {
      owner: { type: "debug", name: "context1" }
    };
    const context2: Context = {
      owner: { type: "debug", name: "context2" }
    };
    const store1 = new Store(rawStore, options1);
    const store2 = new Store(rawStore, options2);
    const state1 = store1.createObservableState(context1);
    const state2 = store2.createObservableState(context2);
    expect(state1[OWNER]).toBe(context1.owner);
    expect(state1.users[OWNER]).toBe(context1.owner);
    expect(state1.users[0][OWNER]).toBe(context1.owner);
    expect(state1.users[0].profile[OWNER]).toBe(context1.owner);
    expect(state2[OWNER]).toBe(context2.owner);
    expect(state2.users[OWNER]).toBe(context2.owner);
    expect(state2.users[0][OWNER]).toBe(context2.owner);
    expect(state2.users[0].profile[OWNER]).toBe(context2.owner);
    expect(state1).not.toBe(state2);
  });

  it("should return the same observable states without owner information in production", () => {
    const options: StoreOptions = {
      mode: "production"
    };
    const store1 = new Store(rawStore, options);
    const store2 = new Store(rawStore, options);
    const state1 = store1.createObservableState({
      owner: { type: "debug", name: "owner1" }
    });
    const state2 = store2.createObservableState({
      owner: { type: "debug", name: "owner2" }
    });
    expect(state1[OWNER]).toBe(null);
    expect(state1.users[OWNER]).toBe(null);
    expect(state1.users[0][OWNER]).toBe(null);
    expect(state1.users[0].profile[OWNER]).toBe(null);
    expect(state2[OWNER]).toBe(null);
    expect(state2.users[OWNER]).toBe(null);
    expect(state2.users[0][OWNER]).toBe(null);
    expect(state2.users[0].profile[OWNER]).toBe(null);
    expect(state1).toBe(state2);
  });
});