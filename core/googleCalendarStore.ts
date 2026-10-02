import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { create } from 'zustand';
import { isShowing } from './showMode';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

// A 401 from the Calendar API means Google itself rejected the token —
// distinct from a network/5xx failure, and handled differently below.
class AuthExpiredError extends Error {}

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: [CALENDAR_SCOPE],
    offlineAccess: false,
  });
  configured = true;
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

interface GoogleCalendarStore {
  signedIn: boolean;
  events: CalendarEvent[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchTodayEvents: () => Promise<void>;
  createEvent: (title: string, durationMinutes: number) => Promise<boolean>;
}

export const useGoogleCalendarStore = create<GoogleCalendarStore>((set, get) => ({
  signedIn: false,
  events: [],
  isLoading: false,
  isSaving: false,
  error: null,

  restoreSession: async () => {
    if (isShowing()) return; // showing someone the app: sample data only
    ensureConfigured();
    if (!GoogleSignin.hasPreviousSignIn()) return;

    try {
      const response = await GoogleSignin.signInSilently();
      if (response.type === 'success') {
        set({ signedIn: true });
        await get().fetchTodayEvents();
      }
    } catch {
      // Silent restore failing just means the user signs in again manually.
    }
  },

  signIn: async () => {
    ensureConfigured();
    set({ error: null });

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        set({ signedIn: true });
        await get().fetchTodayEvents();
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      set({ error: err instanceof Error ? err.message : 'Sign-in failed' });
    }
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // The user's intent was to disconnect — reflect that locally even
      // if the native call had trouble, rather than leaving the screen
      // stuck showing "connected" with no working way to back out.
    }
    set({ signedIn: false, events: [] });
  },

  fetchTodayEvents: async () => {
    if (isShowing()) return; // showing someone the app: sample data only
    set({ isLoading: true, error: null });

    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const url = `${EVENTS_ENDPOINT}?timeMin=${encodeURIComponent(startOfTodayISO())}&timeMax=${encodeURIComponent(endOfTodayISO())}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) throw new AuthExpiredError();
      if (!res.ok) throw new Error(`Calendar fetch failed (${res.status})`);
      const data = await res.json();

      const events: CalendarEvent[] = (data.items ?? []).map((item: any) => ({
        id: item.id,
        title: item.summary ?? '(untitled)',
        start: item.start?.dateTime ?? item.start?.date,
        end: item.end?.dateTime ?? item.end?.date,
      }));

      set({ isLoading: false, events });
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        // A 401 here means Google itself rejected the token — expired,
        // revoked, or scopes changed. getTokens() already handles routine
        // refresh, so this means the session is genuinely no longer good.
        // Staying "signedIn" would leave the screen showing stale events
        // forever with no working path back except a Disconnect button
        // that itself just calls the same broken session. Drop back to
        // the Connect screen instead, where signing in again just works.
        set({ isLoading: false, signedIn: false, events: [], error: 'Google Calendar session expired — reconnect to keep syncing.' });
        return;
      }
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Could not load events' });
    }
  },

  createEvent: async (title, durationMinutes) => {
    if (isShowing()) return false; // showing someone the app: sample data only
    if (!title.trim()) return false;
    set({ isSaving: true, error: null });

    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const start = new Date();
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      const res = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title.trim(),
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        }),
      });
      if (res.status === 401) throw new AuthExpiredError();
      if (!res.ok) throw new Error(`Calendar create failed (${res.status})`);

      set({ isSaving: false });
      await get().fetchTodayEvents();
      return true;
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        set({ isSaving: false, signedIn: false, events: [], error: 'Google Calendar session expired — reconnect to keep syncing.' });
        return false;
      }
      set({ isSaving: false, error: err instanceof Error ? err.message : 'Could not create event' });
      return false;
    }
  },
}));
