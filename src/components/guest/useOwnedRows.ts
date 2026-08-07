"use client";

import { useCallback, useEffect, useState } from "react";
import { forgetEditToken, listOwnedIds, loadEditToken, type EditKind } from "@/lib/edit-tokens";
import { EDIT_TOKEN_HEADER } from "@/lib/edit-token";

/**
 * "Which of these rows did this browser create?"
 *
 * The answer lives in localStorage, which does not exist during SSR — so the
 * owned set starts empty and fills in after mount. Rendering the Edit/Remove
 * controls straight from storage during render would hydrate a different tree
 * than the server sent.
 */
export function useOwnedRows(kind: EditKind) {
  const [owned, setOwned] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe: localStorage is only readable after mount
    setOwned(new Set(listOwnedIds(window.localStorage, kind)));
  }, [kind]);

  const owns = useCallback((id: string) => owned.has(id), [owned]);

  const remember = useCallback((id: string) => {
    setOwned((prev) => new Set(prev).add(id));
  }, []);

  const forget = useCallback(
    (id: string) => {
      forgetEditToken(window.localStorage, kind, id);
      setOwned((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [kind],
  );

  /**
   * Send an authenticated edit/remove. The token travels in a header, never in
   * the URL — a path or query string would end up in server logs and history.
   */
  const send = useCallback(
    async (id: string, init: { method: "PATCH" | "DELETE"; body?: unknown }): Promise<Response> => {
      const token = loadEditToken(window.localStorage, kind, id);
      const headers = new Headers();
      if (token) headers.set(EDIT_TOKEN_HEADER, token);
      if (init.body !== undefined) headers.set("Content-Type", "application/json");

      const path = kind === "photo" ? "/api/photos" : "/api/guestbook";
      return fetch(`${path}/${encodeURIComponent(id)}`, {
        method: init.method,
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    },
    [kind],
  );

  return { owns, remember, forget, send };
}
