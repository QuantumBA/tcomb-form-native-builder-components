import React                    from 'react'
import { getPayloadError }      from 'getpayload'
import objectToFormData         from 'object-to-formdata'

import { createApolloFetch }    from 'apollo-fetch'

import { Button, Text, View }   from 'react-native'
import t                        from 'tcomb-form-native/lib'
import { undefinedTransformer } from '../transformers'

const { Component } = t.form


class Submit extends Component {

  componentDidMount() {
    this._isMounted = true
  }


  shouldComponentUpdate(nextProps, nextState) {

    const { inFlight } = this.state

    return super.shouldComponentUpdate(nextProps, nextState)
        || nextState.inFlight !== inFlight
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  getTemplate() {
    const { inFlight } = this.state
    const { options: { disabled, style } } = this.props

    return ({
      error, hasError, help, label,
      stylesheet: {
        button: { backgroundColor },
        errorBlock,
        formGroup: { normal: formGroupStyle },
        helpBlock: { normal: helpBlockStyle },
      },
    }) => (
      <View style={[formGroupStyle, style]}>
        <View>
          <Button
            accessibilityLabel={help}
            color={backgroundColor}
            disabled={disabled || inFlight}
            title={label}
            onPress={this._onPress}
          />
          {help ? <Text style={helpBlockStyle}>{help}</Text> : null}
          {hasError ? (
            <Text accessibilityLiveRegion="polite" style={errorBlock}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>
    )
  }

  _onPress = () => { // eslint-disable-line
    const {
      options: {
        contentType = 'multipart/form-data',
        form,
        form: { props: { options: { onSubmit } } },
        meta,
        uri,
      },
    } = this.props

    // Implements recursive object serialization according to JSON spec but without quotes around the keys.
    function stringify(obj_from_json) {
      if (typeof obj_from_json !== 'object' || Array.isArray(obj_from_json)) {
        // not an object, stringify using native function
        return JSON.stringify(obj_from_json)
      }
      const props = Object
        .keys(obj_from_json)
        .map(key => `${key}:${stringify(obj_from_json[key])}`)
        .join(',')
      return `${props}`
    }

    const { headers = {}, store = {} } = meta

    let body = form.getValue()
    if (body === null) return onSubmit('Form validation failed')

    if (!uri) {
      return onSubmit({ ...store }, null)
    }

    if (meta.graphql) {

      body = JSON.stringify(body, (key, value) => (value === null ? '' : value))
      const body_json = JSON.parse(body)
      const body_query = stringify(body_json)

      const apolloFetch = createApolloFetch({ uri })

      apolloFetch.useAfter(({ response }, next) => {
        if (response.parsed.errors) {
          throw response.parsed.errors[0]
        }
        next()
      })
      if (meta.graphql.method) {
        const response_fields = meta.graphql.response_fields ? meta.graphql.response_fields.join(' ') : '_id'
        const mutation = `mutation { response: ${meta.graphql.method}(${body_query}) {${response_fields}} }`

        this.setState({ inFlight: true })
        apolloFetch({ query: mutation })
          .then(resp => onSubmit({ ...resp.data, ...store }, null), error => onSubmit(null, error))
          .then(() => this._isMounted && this.setState({ inFlight: false }))
      } else {
        const mutation = `mutation { ${meta.graphql}(${body_query}) {response message} }`

        this.setState({ inFlight: true })
        apolloFetch({ query: mutation })
          .then(resp => onSubmit({ ...resp.data[meta.graphql], ...store }, null), error => onSubmit(null, error))
          .then(() => this._isMounted && this.setState({ inFlight: false }))
      }
    } else {

      if (contentType === 'application/json') body = JSON.stringify(body, (key, value) => (value === null ? '' : value))
      else body = objectToFormData(body)

      this.setState({ inFlight: true })

      fetch(uri, {
        method: 'POST',
        headers,
        body,
      })
        .then(getPayloadError)
        .then(resp => onSubmit({ ...resp, ...store }, null), error => onSubmit(null, error))
        .then(() => this._isMounted && this.setState({ inFlight: false }))
    }
  }

}
Submit.transformer = undefinedTransformer

export default Submit
