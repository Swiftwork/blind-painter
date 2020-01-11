import React, { Component } from 'react';
import { SessionContext } from 'api/session';

interface Props {
  onConnect(participate: boolean, name: string, code?: string): void;
}

interface State {
  host: boolean | undefined;
  name: string;
  code: string;
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      host: undefined,
      name: '',
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
          top: '8%',
          width: '100%',
        }}>
        <h1 style={{ textAlign: 'center', width: '100%' }}>Blind Painter</h1>
        {typeof this.state.host == 'undefined' ? (
          <>
            <button
              type="button"
              style={{
                padding: '0.5em',
                fontSize: '1.5em',
              }}
              onClick={() => this.setState({ host: true })}>
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
                onClick={() => this.setState({ host: false })}>
                Attend venue
              </button>
            </menu>
          </>
        ) : (
          <>
            <input
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={16}
              value={this.state.name}
              onChange={event => this.setState({ name: event.currentTarget.value })}
              style={{
                width: '100%',
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
              onClick={() => this.props.onConnect(true, this.state.name, this.state.code)}>
              Join as painter
            </button>
            <button
              type="button"
              style={{
                padding: '0.5em',
                fontSize: '1.5em',
              }}
              onClick={() => this.props.onConnect(false, this.state.name, this.state.code)}>
              Join as critic
            </button>
          </>
        )}
      </form>
    );
  }
}
