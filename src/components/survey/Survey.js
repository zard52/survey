import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withAuthorization } from '../../session'
import { withFirebase } from '../../firebase'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import { Icon } from '@mdi/react'
import { mdiPlus } from '@mdi/js'
import { Main } from '..'
import airport from 'airport-codes'
import { SurveyCard, AddSurvey, UpdateSurvey } from '.'

class Survey extends Component {

  actions = [
    {
      icon: <Icon path={mdiPlus} size={1} />,
      onClick: () => this.setState({ openFlight: true })
    }
  ]

  state = {
    loading: false,
    flightsRef: null,
    survey: null,
    flight: null,
    activeId: null,
    openFlight: false,
    exibitFlight: false,
  }

  componentDidMount() {
    this.setState({ loading: true })
    const flightsRefs = this.props.firebase.survey()
    flightsRefs.onSnapshot(flightsRef => {
      this.setState({ flightsRef: flightsRef.docs, loading: false, survey: flightsRef.docs })
    })
    // Search
    document.getElementById('searchKey').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.onSearch(e.target.value);
        e.target.value = '';
      }
    })
  }
  onSearch = (country) => {
    const iatas = this.renderAirports(country)
    const survey = this.state.flightsRef.filter(flight => {
      if (iatas.find(aita => aita === flight.data().origin) ||
        iatas.find(aita => aita === flight.data().destination)) {
        return flight;
      }
    })
    this.setState({ survey })
  }
  renderAirports(country) {
    if (country) {
      const airportModelsCountry = airport.filter((model) => model.get('country') === country)
      const airports = airportModelsCountry.map((city) => city.iata !== "" && city.get('iata'))
      return airports;
    }
    return null;
  }
  // Callback function
  handleLike = (pk, flight, userId) => {
    if (flight.likes.find(like => like === userId)) {
      alert('Already Voted!')
    } else {
      flight.likes.push(userId);
      this.props.firebase.addLikeOnFlight(pk, flight.current, flight.likes)
    }
  }
  handleUpdate = (activeId, flight) => {
    this.setState({ activeId, flight })
    this.state.exibitFlight = true
  }
  handleDelete = (pk) => {
    this.props.firebase.removeFlight(pk)
  }

  render() {
    const { survey, openFlight, exibitFlight, flight, activeId } = this.state
    return (
      <Main actions={this.actions}>
        {this.renderSurveyCards(survey)}
        <AddSurvey open={openFlight} onClose={() => this.setState({ openFlight: false })} />
        <UpdateSurvey
          open={exibitFlight}
          onClose={() => this.setState({ exibitFlight: false })}
          pk={activeId}
          flight={flight}
        />
      </Main>
    )
  }

  renderSurveyCards(survey) {
    if (survey) {
      return survey.sort((a, b) => a.data().current < b.data().current ? 1 : -1) // highest number of votes to lowest 
        .map((flight) => {
          return <SurveyCard
            pk={flight.id}
            details={flight.data()}
            onLike={this.handleLike}
            onUpdate={this.handleUpdate}
            onDelete={this.handleDelete}
          />
        })
    }
  }

}

const condition = authUser => !!authUser;

export default connect()(
  compose(
    withRouter,
    withFirebase,
    withAuthorization(condition),
  )(Survey))