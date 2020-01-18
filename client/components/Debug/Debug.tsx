import React, { useContext } from 'react';
import { SessionContext } from 'context/store';

import s from './Debug.module.css';

export function Debug() {
  const context = useContext(SessionContext);

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
        context,
        (key, value) => {
          if (key == 'clients') return value.size;
          return value;
        },
        2,
      )}
    </pre>
  );
}
