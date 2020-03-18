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
      shown: false,
    };
  }

  componentDidMount() {
    if (this.context.currentRound == 0) {
      this.setState({ shown: true });
      setTimeout(() => {
        this.setState({ shown: false });
      }, 1000 * 14);
    } else {
      this.setState({ shown: false });
    }
  }

  public render() {
    return (
      <div className={`${s.subject}`} aria-hidden={!this.state.shown}>
        Category: {this.context.category || 'Category could not be determined'}
        <br />
        {this.context.subject || 'Subject could not be determined'}
      </div>
    );
  }
}
