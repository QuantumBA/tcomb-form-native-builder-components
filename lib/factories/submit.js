import React                    from 'react'

import { Button, Text, View }   from 'react-native'
import t                        from 'tcomb-form-native/lib'
import { undefinedTransformer } from '../transformers'
import { processListRemoteUpdate } from '../requests/requests'

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
        form,
        form: { props: { options: { onSubmit } } },
        remote,
        meta: { store },
      },
    } = this.props

    const formValues = form.getValue()
    if (formValues === null) {
      return onSubmit('Form validation failed')
    }

    // No remote update
    if (!remote) {
      return onSubmit({ ...store }, null)
    }

    this.setState({inFlight: true})
    processListRemoteUpdate(remote, formValues)
      .then(resp => onSubmit({ ...resp.data, ...store }, null), error => onSubmit(null, error))
      .then(() => this._isMounted && this.setState({inFlight: false}))
  }

}

Submit.transformer = undefinedTransformer

export default Submit
