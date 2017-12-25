import React, { Component } from 'react';
import { computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Button, Segment, Step } from 'semantic-ui-react';
import * as _ from 'lodash';
import PlayerCardCount from './PlayerCardCount';
import SelectPrimary from './SelectPrimary';
import SelectOpponents from './SelectOpponents';
import SelectCards from './SelectCards';

@observer
export default class NewGame extends Component {

  @observable selectedPlayers = new Map();
  @observable primaryCardsMap = new Map();
  @observable playerCardCounts = new Map();
  @observable primary;

  validCardCounts = new Map([
    [6, [3, 3, 3, 3, 3, 3]],
    [5, [3, 3, 4, 4, 4]],
    [4, [4, 4, 5, 5]],
    [3, [6, 6, 6]],
  ]);

  @observable steps = [
    {
      title: 'Select a player',
      active: true,
      completed: computed(() => !!this.primary),
      component: () => {
        const { store: { cardStore: { people } } } = this.props;
        return (
          <SelectPrimary people={people}
            primary={this.primary}
            setPrimary={person => this.setPrimary(person)} />
        );
      },
    },
    {
      title: 'Select opponents',
      active: false,
      completed: computed(() => this.countSelectedPlayers > 1),
      component: () => {
        const { store: { cardStore: { people } } } = this.props;
        return (
          <SelectOpponents people={people.filter(person => person !== this.primary)}
            selectedPlayers={this.selectedPlayers}
            togglePlayer={player => this.togglePlayer(player)} />
        );
      },
    },
    {
      title: 'Cards per player',
      active: false,
      completed: computed(() => this.cardCountsValid),
      component: () => {
        return (
          <PlayerCardCount players={this.allPlayers}
            playerCardCounts={this.playerCardCounts}
            validCardCounts={this.validCardCounts}
            onCountChange={(player, value) => this.setCardCount(player, value)} />
        );
      }
    },
    {
      title: 'Select your cards',
      active: false,
      completed: computed(() =>
        this.primaryCards.length === this.playerCardCounts.get(this.primary)),
      component: () => {
        const { store: { cardStore: { people, weapons, rooms } } } = this.props;
        return (
          <SelectCards people={people}
            weapons={weapons}
            rooms={rooms}
            selectedCards={this.primaryCardsMap}
            toggleCard={card => this.toggleCard(card)} />
        );
      }
    },
  ];

  @computed get countSelectedPlayers() {
    return [...this.selectedPlayers].filter(entry => entry[1]).length;
  }

  @computed get allPlayers() {
    const players = [...this.selectedPlayers].filter(entry => entry[1])
                                             .map(entry => entry[0]);
    players.push(this.primary);
    return players;
  }

  @computed get cardCountsValid() {
    const playerCount = this.allPlayers.length;
    const counts = [...this.playerCardCounts].map(entry => entry[1])
                                             .sort((a, b) => a - b);
    return _.isEqual(counts, this.validCardCounts.get(playerCount));
  }

  @computed get primaryCards() {
    return [...this.primaryCardsMap].filter(entry => entry[1])
                                  .map(entry => entry[0]);
  }

  setPrimary(person) {
    this.primary = person;
    this.steps[0].active = false;
    this.steps[1].active = true;
  }

  setCardCount(person, count) {
    this.playerCardCounts.set(person, count);
  }

  togglePlayer(player) {
    this.selectedPlayers.set(player, !this.selectedPlayers.get(player));
  }

  toggleCard(card) {
    this.primaryCardsMap.set(card, !this.primaryCardsMap.get(card));
  }

  nextStep(activeIndex) {
    if (activeIndex+1 < this.steps.length) {
      this.steps[activeIndex].active = false;
      this.steps[activeIndex+1].active = true;
    }
  }

  render() {
    const stepsElements = this.steps.map((step, idx) => (
      <Step key={idx} active={step.active} completed={step.completed} title={step.title} />
    ));
    const activeStep = this.steps.find(step => step.active);
    const activeIndex = this.steps.indexOf(activeStep);
    return (
      <div>
        <Step.Group ordered>
          {stepsElements}
        </Step.Group>
        {activeIndex === 1 && this.steps[0].component()}
        {activeStep.component()}
        <Segment basic>
          <Button disabled={!activeStep.completed}
            onClick={() => this.nextStep(activeIndex)}
            primary>Next</Button>
        </Segment>
      </div>
    );
  }
}
