import React, { Component, createRef } from 'react';

import s from './Settings.module.css';
import { SelectRange } from 'components/SelectRange/SelectRange';

import ClearIcon from 'assets/icons/clear.svg';
import { RangeSlider } from 'components/RangeSlider/RangeSlider';

interface Props {
  onChange?: (settings: SettingsState) => void;
}

export interface SettingsState {
  musicVolume: number;
  soundVolume: number;
  turnDuration: number;
  players: number;
  rounds: number;
}

export class Settings extends Component<Props, SettingsState> {
  private dialogRef = createRef<HTMLDialogElement>();

  constructor(props: Props) {
    super(props);

    this.state = {
      musicVolume: 50,
      soundVolume: 50,
      turnDuration: 45,
      players: 7,
      rounds: 2,
    };
  }

  public show = () => {
    this.dialogRef.current && this.dialogRef.current.showModal();
  };

  public close = () => {
    this.dialogRef.current && this.dialogRef.current.close();
  };

  private update<K extends keyof SettingsState>(value: Pick<SettingsState, K>) {
    this.setState(value, () => {
      if (this.props.onChange) this.props.onChange({ ...this.state });
    });
  }

  public render() {
    return (
      <dialog ref={this.dialogRef} className={s.settings}>
        <ClearIcon className={s.close} onClick={this.close} />
        <h2 className={s.title}>Settings</h2>
        <label className={s.label}>Music Volume</label>
        <RangeSlider
          className={`${s.input} ${s.range}`}
          max={100}
          step={5}
          value={this.state.musicVolume}
          onChange={musicVolume => this.update({ musicVolume })}
        />
        <label className={s.label}>Sounds Volume</label>
        <RangeSlider
          className={`${s.input} ${s.range}`}
          max={100}
          step={5}
          value={this.state.soundVolume}
          onChange={soundVolume => this.update({ soundVolume })}
        />
        <label className={s.label}>Number of Players</label>
        <SelectRange
          className={s.range}
          min={3}
          max={10}
          value={this.state.players}
          onChange={players => this.update({ players })}
        />
        <label className={s.label}>Number of Rounds</label>
        <SelectRange
          className={s.range}
          min={1}
          max={5}
          value={this.state.rounds}
          onChange={rounds => this.update({ rounds })}
        />
        <label className={s.label}>Turn Duration in Seconds</label>
        <SelectRange
          className={s.range}
          min={15}
          max={90}
          step={15}
          value={this.state.turnDuration}
          onChange={turnDuration => this.update({ turnDuration })}
        />
      </dialog>
    );
  }
}
