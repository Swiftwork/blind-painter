import React, { Component } from 'react';
import { SessionContext } from 'api/session';

interface Props {
  onVenue(host: boolean, code?: string): void;
  onParticipate(painter: boolean): void;
}

interface State {
  code: string;
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      code: '',
    };
  }

  public render() {
    return (
      <form
        style={{
          position: 'absolute',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          top: '10%',
          width: '100%',
        }}>
        <h1 style={{ textAlign: 'center', width: '100%' }}>Blind Painter</h1>
        {!this.context.connected ? (
          <>
            <button
              type="button"
              style={{
                padding: '0.5em',
                fontSize: '1.5em',
              }}
              onClick={() => this.props.onVenue(true)}>
              Host venue
            </button>
            <menu style={{ margin: 0 }}>
              <input
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={8}
                value={this.state.code}
                onChange={event => this.setState({ code: event.currentTarget.value })}
                style={{
                  textAlign: 'center',
                  width: '8em',
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
                }}
                onClick={() => this.props.onVenue(false, this.state.code)}>
                Attend venue
              </button>
            </menu>
          </>
        ) : (
          <>
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
          </>
        )}
      </form>
    );
  }
}
