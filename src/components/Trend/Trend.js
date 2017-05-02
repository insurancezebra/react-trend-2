import React, { Component, PropTypes } from 'react';
import { omit } from '../../utils';
import {
  buildSmoothPath,
  buildLinearPath,
  injectStyleTag,
} from '../../helpers/DOM.helpers';
import { normalize } from '../../helpers/math.helpers';
import { generateId } from '../../helpers/misc.helpers';
import { normalizeDataset, generateAutoDrawCss } from './Trend.helpers';

const propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        value: PropTypes.number,
      }),
    ]).isRequired
  ).isRequired,
  smooth: PropTypes.bool,
  autoDraw: PropTypes.bool,
  autoDrawDuration: PropTypes.number,
  autoDrawEasing: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  padding: PropTypes.number,
  radius: PropTypes.number,
  gradient: PropTypes.arrayOf(PropTypes.string),
};

const defaultProps = {
  radius: 10,
  stroke: 'black',
  padding: 8,
  strokeWidth: 1,
  autoDraw: false,
  autoDrawDuration: 2000,
  autoDrawEasing: 'ease',
};

class Trend extends Component {
  constructor(props) {
    super(props);
    this.state = { currentClass: 'animate' };

    // Generate a random ID. This is important for distinguishing between
    // Trend components on a page, so that they can have different keyframe
    // animations.
    this.trendId = generateId();
    this.gradientId = `react-trend-vertical-gradient-${this.trendId}`;
    this.autoDraw = this.autoDraw.bind(this);
  }

  componentDidMount() {
    this.autoDraw();
  }

  // moved this functionality out of componentDidMount
  // so we can access it from anywhere
  autoDraw(first) {
    const { autoDraw, autoDrawDuration, autoDrawEasing } = this.props;

    // const path = document.querySelector('.trend-line path');
    // path.classList.add('animate');
    // // remove animate class after animation duration
    // so it will re-trigger itself each time
    this.setState({ currentClass: 'animate' })
        window.setTimeout(() => {
          this.setState({ currentClass: '' });
        }, autoDrawDuration);

    if (autoDraw) {
      this.lineLength = this.path.getTotalLength();
      // if we already have a "new" value, that means it is no longer
      // "new" but the "current" value
      if (this.newLength) {
        this.currLength = this.newLength;
      }
      // otherwise, it's the first time around and we don't have a value
      else {
        this.currLength = 0;
      }
      this.newLength = this.lineLength;

      const css = generateAutoDrawCss({
        id: this.trendId,
        lineLength: this.currLength,
        newLength: this.newLength,
        duration: autoDrawDuration,
        easing: autoDrawEasing,
      });

      injectStyleTag(css);
    }
  }

  componentWillReceiveProps() {
    this.autoDraw();
  }

  getDelegatedProps() {
    return omit(this.props, Object.keys(propTypes));
  }

  renderGradientDefinition() {
    const { gradient } = this.props;

    return (
      <defs>
        <linearGradient
          id={this.gradientId}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          {gradient.slice().reverse().map((c, index) => (
            <stop
              key={index}
              offset={normalize({
                value: index,
                min: 0,
                // If we only supply a single colour, it will try to normalize
                // between 0 and 0, which will create NaN. By making the `max`
                // at least 1, we ensure single-color "gradients" work.
                max: gradient.length - 1 || 1,
              })}
              stopColor={c}
            />
          ))}
        </linearGradient>
      </defs>
    );
  }

  render() {
    const {
      data,
      smooth,
      width,
      height,
      padding,
      radius,
      gradient,
    } = this.props;

    // We need at least 2 points to draw a graph.
    if (!data || data.length < 2) {
      return null;
    }

    // `data` can either be an array of numbers:
    // [1, 2, 3]
    // or, an array of objects containing a value:
    // [ { value: 1 }, { value: 2 }, { value: 3 }]
    //
    // For now, we're just going to convert the second form to the first.
    // Later on, if/when we support tooltips, we may adjust.
    const plainValues = data.map(point => (
      typeof point === 'number' ? point : point.value
    ));

    // Our viewbox needs to be in absolute units, so we'll default to 300x75
    // Our SVG can be a %, though; this is what makes it scalable.
    // By defaulting to percentages, the SVG will grow to fill its parent
    // container, preserving a 1/4 aspect ratio.
    const viewBoxWidth = width || 300;
    const viewBoxHeight = height || 75;
    const svgWidth = width || '100%';
    const svgHeight = height || '25%';
    const normalizedValues = normalizeDataset(plainValues, {
      minX: padding,
      maxX: viewBoxWidth - padding,
      // NOTE: Because SVGs are indexed from the top left, but most data is
      // indexed from the bottom left, we're inverting the Y min/max.
      minY: viewBoxHeight - padding,
      maxY: padding,
    });

    const path = smooth
      ? buildSmoothPath(normalizedValues, { radius })
      : buildLinearPath(normalizedValues);

    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        {...this.getDelegatedProps()}
      >
        {gradient && this.renderGradientDefinition()}

        <path
          className={this.state.currentClass}
          ref={(elem) => { this.path = elem; }}
          id={`react-trend-${this.trendId}`}
          d={path}
          fill="none"
          stroke={gradient ? `url(#${this.gradientId})` : undefined}
        />
      </svg>
    );
  }
}

Trend.propTypes = propTypes;
Trend.defaultProps = defaultProps;

export default Trend;