import React from 'react';
import { Session } from 'api/session';

import s from './Debug.module.css';

export function Debug({ session }: { session: Session }) {
  return (
    <pre className={s.debug}>
      <button
        onClick={() => {
          sessionStorage.removeItem('session');
          window.location.reload();
        }}>
        Clear
      </button>
      <br />
      {JSON.stringify(
        session,
        (key, value) => {
          if (key == 'clients') return value.size;
          return value;
        },
        2,
      )}
    </pre>
  );
}
