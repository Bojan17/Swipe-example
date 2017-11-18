import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250 //miliseconds

class Deck extends Component {
  //if prop is not assigned use this prop as a default
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
  }

  constructor(props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      //will be called on ever screen press
      onStartShouldSetPanResponder: () => true,
      //called any time users start dragging finger
      //gesture object gives us details about move that has been made
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      //called on finger remove
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });

    this.state = { panResponder, position, index: 0 };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({ index: 0 });
    }
  }

  componentWillUpdate() {
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    LayoutAnimation.spring();
  }

  //take image off screen after we reach SWIPE_THRESHOLD
  forceSwipe(direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.state.position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => this.onSwipeComplete(direction));
  }

  resetPosition() {
    Animated.spring(this.state.position, {
      toValue: { X: 0, y: 0 }
    }).start();
  }

  onSwipeComplete(direction) {
    const { onSwipeLeft, onSwipeRight } = this.props;
    //geting swiped card index
    const item = this.props.data[this.state.index];

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.setState({ index: this.state.index + 1 });
    this.state.position.setValue({ x:0, y:0 });
  }

getCardStyle() {
  //connecting change in position and rotation of card
  const { position } = this.state;
  const rotate = position.x.interpolate({
    //interpolating two scales, if it's dragged from left to right
    //element will rotate with coresponding degre on second scale
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-120deg', '0deg', '120deg']
  });

  return {
    ...position.getLayout(),
    transform: [{ rotate }]
  };
}

  renderCards() {
    if (this.state.index >= this.props.data.length) {
      return this.props.renderNoMoreCards();
    }

    return this.props.data.map((item, i) => {
      //if the card is already swiped dont render it,discard it
      if (i < this.state.index) { return null; }
      //if this is next card (this.state.index + 1) attach handlers,make card,render it
      if (i === this.state.index) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.cardStyles]}
            {...this.state.panResponder.panHandlers}
            >
            {this.props.renderCard(item)}
          </Animated.View>
        );
      }
      //every card that is not current one
      return (
        <Animated.View
          key={item.id}
          style={[styles.cardStyles, { top: 10 * (i - this.state.index)}]}
        >
          {this.props.renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  render() {
    return (
      //take all callback and pass them to View
      <View>
        {this.renderCards()}
      </View>
    );
  }
}

const styles = {
  cardStyles: {
    position: 'absolute',
    width: SCREEN_WIDTH
  }
};

export default Deck;
