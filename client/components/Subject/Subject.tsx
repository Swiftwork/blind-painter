import React, { Component } from 'react';

import s from './Subject.module.css';
import { SessionContext } from 'context/store';

interface Props {}

interface State {
  shown: boolean;
}

export class Subject extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      shown: true,
    };
  }

  componentDidMount() {
    console.log('mounted');
    setTimeout(() => {
      this.setState({ shown: false });
    }, 1000 * 14);
  }

  public render() {
    return (
      <div className={`${s.subject}`} aria-hidden={!this.state.shown}>
        {this.context.subject || 'Batman: The Dark Knight Rises'}
      </div>
    );
  }
}
