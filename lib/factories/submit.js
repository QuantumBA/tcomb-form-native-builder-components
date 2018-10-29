import React                    from 'react'

import { Button, Text, View }   from 'react-native'
import t                        from 'tcomb-form-native/lib'
import { undefinedTransformer } from '../transformers'
import { processRemoteUpdateGraphQL, processRemoteUpdateRest } from '../requests/requests'

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

  setInflight = (inFlight) => {
    this.setState(inFlight)
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

    const { headers = {}, store = {} } = meta

    const body = form.getValue()
    if (body === null) return onSubmit('Form validation failed')

    // No remote update
    if (!uri) {
      return onSubmit({ ...store }, null)
    }

    // Graphql API
    if (meta.graphql) {
      return processRemoteUpdateGraphQL(uri, body, meta, store, onSubmit, this.setInflight)
    }

    return processRemoteUpdateRest(uri, body, contentType, headers, meta, store, onSubmit, this.setInflight)

  }

}

Submit.transformer = undefinedTransformer

export default Submit
