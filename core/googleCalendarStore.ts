import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { create } from 'zustand';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
}

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
    await GoogleSignin.signOut();
    set({ signedIn: false, events: [] });
  },

  fetchTodayEvents: async () => {
    set({ isLoading: true, error: null });

    try {
      const { accessToken } = await GoogleSignin.getTokens();
      const url = `${EVENTS_ENDPOINT}?timeMin=${encodeURIComponent(startOfTodayISO())}&timeMax=${encodeURIComponent(endOfTodayISO())}&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
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
      set({ isLoading: false, error: err instanceof Error ? err.message : 'Could not load events' });
    }
  },

  createEvent: async (title, durationMinutes) => {
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
      if (!res.ok) throw new Error(`Calendar create failed (${res.status})`);

      set({ isSaving: false });
      await get().fetchTodayEvents();
      return true;
    } catch (err) {
      set({ isSaving: false, error: err instanceof Error ? err.message : 'Could not create event' });
      return false;
    }
  },
}));
