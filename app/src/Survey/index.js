import React, { Component, Fragment } from 'react';
import { Redirect } from 'react-router-dom';
import Modal from 'react-modal';
import { CSSTransition } from 'react-transition-group';
import Keyboard from 'react-simple-keyboard';
import { Bar } from 'react-chartjs-2';
import PieChart from '../PieChart';
import SurveyChart from '../SurveyChart';
import Chart from '../Chart';

import styles from './style.css';
import { client } from './services';

import bg from '../images/bg-Q1.png';
import slide from '../images/slide_bar-without_selection.png';
import yesSlide from '../images/slide_bar-selected_yes.png';
import noSlide from '../images/slide_bar-selected_no.png';
import slider from '../images/slider-white.png';
import yesSlider from '../images/Slider-green.png';
import noSlider from '../images/slider-red.png';
import listen from '../images/icons8_International_Music_96px_1.png';
import think from '../images/icons8_Thinking_Male_96px_1.png';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '75%',
    backgroundColor: '#cf7500',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    borderRadius: '.5rem'
  }
};

const customStyle = {
  content: {
    top: '40%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    width: '50%',
    backgroundColor: '#cf7500',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '1rem',
    borderRadius: '.5rem'
  }
};

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

Modal.setAppElement('#root');

class Survey extends Component {
  state = {
    layoutName: 'default',
    visible: false,
    inputName: 'name',
    shouldRedirect: false,
    total: 0,
    disabled: true,
    question: 'choice',
    modalIsOpen: false,
    census: '',
    error: '',
    chart: '',
    user: '',
    isChart: false,
    data: {
      name: '',
      email: '',
      comment: '',
      questionOne:
        'Should you be able to download and/or stream music for free?',
      questionTwo:
        "Who should have the maximunm rights over a piece of music, and consequently get a lion's share of the proceeds",
      answerTwo: [
        { value: 15, title: 'MUSIC COMPOSER' },
        { value: 15, title: 'LYRICIST' },
        { value: 15, title: 'SINGER' },
        { value: 15, title: 'INSTRUMENT PLAYERS' },
        {
          value: 15,
          title: 'PRODUCER (THE ONE WHO PAYS)'
        },
        { value: 15, title: 'DISTRIBUTION CHANNEL' },
        { value: 10, title: 'ME, THE LISTENER!' }
      ]
    }
  };

  async componentDidMount() {
    try {
      const census = await client.getAll();
      const total =
        parseInt(census[0].count_yes) + parseInt(census[0].count_no);
      console.log(total);
      this.setState({
        census: {
          yes: (census[0].count_yes / total) * 100,
          no: (census[0].count_no / total) * 100
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  chartHandler = res => {
    const { data } = this.state;
    data.answerTwo = [...res];
    this.setState({
      data
    });
  };

  clickHandler = async evt => {
    const { value } = evt.target;
    const name = evt.target.name || evt.currentTarget.getAttribute('name');
    const { data, question, user } = this.state;
    const { history } = this.props;

    if (name === 'next' && question === 'choice') {
      this.props.setData(data);
      this.props.setClass('fade');
      this.setState(
        {
          visible: false,
          question: 'chart'
        },
        () => this.props.history.push('/survey2')
      );
      return;
    }

    if (name === 'next' && question === 'pie') {
      this.setState({ modalIsOpen: true, question: '' });
      return;
    }

    if (name === 'continue') {
      this.setState({ modalIsOpen: true, question: '' });
      return;
    }

    if (name === 'nope') {
      this.setState({ modalIsOpen: false, question: '' }, () =>
        history.push('/thanks')
      );
      return;
    }

    if (name === 'user') {
      const name = !!data.name;
      const email = validateEmail(data.email);
      const error = { name, email };
      if (!error.email || !error.name) {
        this.setState({
          error
        });
        return;
      }
      try {
        await client.update({ ...data, id: user });
        this.setState({ modalIsOpen: false, question: '', error }, () =>
          history.push('/thanks')
        );
        return;
      } catch (err) {
        console.log(err);
      }
    }

    if (name === 'back' && question == 'choice') {
      this.props.setClass('alert');
      this.setState({ question: 'choice', modalIsOpen: false, visible: false });
      return;
    }

    if (name === 'back' && question == 'pie') {
      this.setState({ question: 'chart', modalIsOpen: false });
      return;
    }
    if (name === 'user' && question === 'chart' && data.comment) {
      const status = validateEmail(data.email);
      if (!status) return;
      try {
        const user = await client.create(data);
        this.setState({ shouldRedirect: true, user: user.id });
      } catch (err) {
        console.log(err);
      }
      return this.setState({ data });
    }
    if (name && value) {
      data.answerOne = value;
      this.setState({
        data,

        disabled: false
      });
      return;
    }
    if (!data.answerOne) return;

    if (name === 'answer' && question === 'chart') {
      try {
        const census = await client.getChart();
        const found = Object.values(census[0]).filter(v => v > 0);
        const user = await client.create(data);
        return this.setState({
          user: user.id,
          data,
          question: found.length ? 'pie' : '',
          modalIsOpen: true,

          chart: census[0]
        });
      } catch (err) {
        console.log(err);
        return;
      }
    }

    this.props.setData(data);
    this.props.setClass('fade');
    return this.setState(
      {
        modalIsOpen: true,
        visible: true
      },
      () => history.push('/census')
    );
  };

  onChange = input => {
    const { data, inputName } = this.state;
    console.log(input, data, inputName);
    data[inputName] = input;
    this.setState({
      data
    });
  };

  onFocus = evt => this.setActiveInput(evt.target.name);

  setActiveInput = inputName => {
    this.setState({
      inputName
    });
  };

  onKeyPress = button => {
    console.log('Button pressed', button);

    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === '{shift}' || button === '{lock}') this.handleShift();
  };

  handleShift = () => {
    const layoutName = this.state.layoutName;

    this.setState({
      layoutName: layoutName === 'default' ? 'shift' : 'default'
    });
  };

  onChangeAll = inputObj => {
    const { data } = this.state;
    console.log(data, inputObj);
    this.setState({
      data: { ...data, ...inputObj }
    });
  };

  onChangeInput = event => {
    const { data } = this.state;
    const { name, value } = event.target;
    data[name] = value;
    this.setState(
      {
        data
      },
      () => {
        this.keyboard.setInput(value);
      }
    );
  };

  closeModal = () => {
    this.setState({
      modalIsOpen: false
    });
  };

  redirectPath = () => '/';

  render() {
    const {
      question,
      modalIsOpen,
      data,
      inputName,
      layoutName,
      error,
      census,
      chart,
      visible,
      shouldRedirect,
      isChart
    } = this.state;

    if (shouldRedirect) {
      return <Redirect to={this.redirectPath()} />;
    }
    return (
      <Fragment>
        {question === 'choice' && !visible && (
          <div className="ui padded center aligned grid">
            <div className="sixteen wide column" style={{ padding: 0 }}>
              <div
                className={`ui very padded segment ${styles.surveyContainer}`}
              >
                <h1 className={`ui inverted header ${styles.surveyQuestion}`}>
                  <div className={` ${styles.question}`}>
                    Should you be able to download and/or
                  </div>{' '}
                  <div className={` ${styles.question}`}>
                    {' '}
                    stream music for free?
                  </div>
                </h1>
                <div className={styles.buttonWrapper}>
                  {data.answerOne === 'yes' ? (
                    <Fragment>
                      <button
                        onClick={this.clickHandler}
                        className="ui green massive button"
                        name="yes"
                        value="yes"
                        style={{ marginRight: 0 }}
                      >
                        Yes
                      </button>
                      <div className="ui image" style={{ height: '32px' }}>
                        <img src={yesSlide} />
                      </div>

                      <img src={yesSlider} className={styles.yesSlider} />

                      <button
                        name="no"
                        value="no"
                        onClick={this.clickHandler}
                        className="ui massive button"
                        style={{
                          marginRight: 0,
                          background: '#fff',
                          color: '#ccc'
                        }}
                      >
                        No
                      </button>
                    </Fragment>
                  ) : data.answerOne === 'no' ? (
                    <Fragment>
                      <button
                        onClick={this.clickHandler}
                        className="ui massive button"
                        name="yes"
                        value="yes"
                        style={{
                          marginRight: 0,
                          background: '#fff',
                          color: '#ccc'
                        }}
                      >
                        Yes
                      </button>
                      <div className="ui image" style={{ height: '32px' }}>
                        <img src={noSlide} />
                      </div>

                      <img src={noSlider} className={styles.noSlider} />

                      <button
                        name="no"
                        value="no"
                        onClick={this.clickHandler}
                        className="ui red massive button"
                      >
                        No
                      </button>
                    </Fragment>
                  ) : (
                    <Fragment>
                      <button
                        onClick={this.clickHandler}
                        className="ui massive button"
                        style={{
                          marginRight: 0,
                          background: '#fff',
                          color: '#ccc'
                        }}
                        name="yes"
                        value="yes"
                      >
                        Yes
                      </button>
                      <div className="ui image" style={{ height: '32px' }}>
                        <img src={slide} />
                      </div>

                      <img src={slider} className={styles.slider} />

                      <button
                        name="no"
                        value="no"
                        onClick={this.clickHandler}
                        className="ui massive button"
                        style={{
                          marginRight: 0,
                          background: '#fff',
                          color: '#ccc'
                        }}
                      >
                        No
                      </button>
                    </Fragment>
                  )}
                </div>
              </div>
              {data.answerOne === 'yes' ? (
                <div className={styles.submitButtonWrapper}>
                  <button
                    name="answer"
                    className={`ui fluid green huge button ${
                      styles.submitButton
                    }`}
                    onClick={this.clickHandler}
                  >
                    Submit
                  </button>
                </div>
              ) : data.answerOne === 'no' ? (
                <div className={styles.submitButtonWrapper}>
                  <button
                    name="answer"
                    className={`ui fluid red huge button ${
                      styles.submitButton
                    }`}
                    onClick={this.clickHandler}
                  >
                    Submit
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
        <CSSTransition
          in={visible}
          timeout={450}
          classNames="slide"
          unmountOnExit
          onEntered={() => {
            console.log('exited');
            this.setState({ isChart: true });
          }}
        >
          <div className="ui padded center aligned grid">
            <div className="sixteen wide column" style={{ padding: 0 }}>
              <div
                className={`ui very padded segment ${styles.surveyContainer}`}
              >
                <button
                  type="button"
                  className="circular ui left floated icon button"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  name="back"
                  onClick={this.clickHandler}
                >
                  <i className="blue left chevron icon" />
                </button>
                <h1 className={`ui inverted header ${styles.surveyQuestion}`}>
                  <div className={`content ${styles.question}`}>
                    Should you be able to download and/or
                  </div>
                  <div className={`content ${styles.question}`}>
                    stream music for free?
                  </div>
                </h1>
                <div className={styles.chartContainer}>
                  <p
                    style={{
                      color: '#fff',
                      textAlign: 'left',
                      position: 'absolute'
                    }}
                  >
                    What others think,
                  </p>
                  {isChart ? <PieChart census={census} /> : null}{' '}
                </div>
                <div className={styles.proceedButtonWrapper}>
                  <button
                    name="next"
                    className={`ui fluid teal small button ${
                      styles.submitButton
                    }`}
                    onClick={this.clickHandler}
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CSSTransition>
      </Fragment>
    );
  }
}

export default Survey;
