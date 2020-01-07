import React, { Component } from 'react';

interface Props {}

interface State {}

export class Menu extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  public render() {
    return (
      <form
        style={{
          position: 'absolute',
          top: 0,
        }}>
        <input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{
            backgroundColor: 'rgba(255,255,255,0.5)',
            border: '2px solid',
            padding: '0.5em',
            letterSpacing: '4px',
            fontSize: '1.5em',
          }}
        />
        <button
          type="button"
          style={{
            padding: '0.5em',
            fontSize: '1.5em',
          }}>
          Join as painter
        </button>
        <button
          type="button"
          style={{
            padding: '0.5em',
            fontSize: '1.5em',
          }}>
          Join as critic
        </button>
      </form>
    );
  }
}
