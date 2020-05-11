import React                    from 'react'
import { Button, Text, View, Linking }   from 'react-native'
import { Button as ButtonPaper } from 'react-native-paper'
import t                        from 'tcomb-form-native/lib'
import { processListRemoteUpdate } from 'tcomb-form-native-builder-utils'
import Papa from 'papaparse'
import { undefinedTransformer } from '../transformers'


const { Component } = t.form


class MassUpload extends Component {

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
    // const { inFlight } = this.state
    const { options: { style } } = this.props // disabled

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
            // disabled={disabled || inFlight}
            title={label}
            onPress={this._onPress}
          />
          {help ? <Text style={helpBlockStyle}>{help}</Text> : null}
          {hasError ? (
            <Text accessibilityLiveRegion="polite" style={errorBlock}>
              {error}
            </Text>
          ) : null}
          {this.renderExportButton(this.getFieldsHeaders(), backgroundColor)}
        </View>
      </View>
    )
  }

  _onPress = () => { // eslint-disable-line
    const {
      options: {
        form: { props: { options: { triggerValidation, showModal } } },
      },
    } = this.props
    /*
    Call on the Modal (tcomb-form-native-builder) class method to show it
    while passing a callback function with the user comment as parameter
    to define the action to be performed after the form has been validated
    and the user confirms the modal.
    */
    triggerValidation().then((formIsValid) => {
      if (formIsValid) showModal(comment => this.confirmAction(comment))
    })
  }

  renderExportButton = (values, backgroundColor) => (
    <ButtonPaper
      icon="launch"
      color={backgroundColor}
      labelStyle={{ color: backgroundColor }}
      onPress={() => this.exportCSV(values)}
    >
      Download template
    </ButtonPaper>
  )

  exportCSV = (values) => {
    if (!values || !values.size) return

    const keys = Array.from(values)
    const header = keys.join('%2C')

    Linking.openURL(`data:text/csv;charset=utf-8,${header}%0A`)
  }

  isSetsEqual = (csvHeaders, updateFieldsRequired) => csvHeaders.size === updateFieldsRequired.size && [...csvHeaders].every(value => updateFieldsRequired.has(value))

  getFieldsHeaders = () => {
    const { options: { remote } } = this.props
    const updateFieldsRequired = new Set()

    remote.forEach((request) => {
      if (!request.meta.graphql.type) {
        request.meta.updateFields.forEach(updateField => Object.values(updateField).forEach(field => updateFieldsRequired.add(field)))
      }
    })
    return updateFieldsRequired
  }

  processMassUpload = (csvData, actionComment) => {
    const {
      options: {
        form: { props: { options: { onSubmit, stackedPlaceHolders } } },
        remote,
        meta: { store, fieldsToStore, query, summaryFields, graphqlURI },
      },
    } = this.props
    const csvHeaders = new Set(csvData.meta.fields)

    const successfulResponses = []
    const errors = []
    let promises
    if (this.isSetsEqual(csvHeaders, this.getFieldsHeaders())) {
      promises = csvData.data.map(request => processListRemoteUpdate(remote, request, stackedPlaceHolders))
    } else {
      return onSubmit(null, 'Check files headers', actionComment)
    }
    Promise.allSettled(promises)
      .then((promise) => {
        promise.forEach((promiseResult, line) => {
          if (promiseResult.status === 'fulfilled') {
            const responseStore = Object.assign({}, promiseResult.value[0].data)
            if (fieldsToStore) {
              responseStore.response = {}
              fieldsToStore.forEach((field) => {
                const fieldSplit = field.split(':')
                responseStore.response[fieldSplit[1]] = promiseResult.value[fieldSplit[0]].data.response[fieldSplit[1]] ? promiseResult.value[fieldSplit[0]].data.response[fieldSplit[1]] : promiseResult.value[fieldSplit[0]].data.response[0][fieldSplit[1]]
              })
            }
            if (query && summaryFields && graphqlURI) {
              responseStore.response.query = `{${query.type}(${query.key}: "${responseStore.response[query.key]}")`
              responseStore.response.query += '{ ${fields} }}' // eslint-disable-line
              responseStore.response.data_type = query.type
              responseStore.response.data_uid_field = query.key
              responseStore.response.data_uid = responseStore.response[query.key]
              responseStore.response.summaryFields = summaryFields
              responseStore.response.uri = graphqlURI
            }
            successfulResponses.push({ ...responseStore, ...store, line: line + 2 })
          } else {
            errors.push({ [`${line + 2}`]: promiseResult.reason.message })
          }
        })
        onSubmit(successfulResponses, errors, actionComment)
      })
  }

  confirmAction(actionComment) {
    const {
      options: {
        form,
        form: { props: { value, options: { onSubmit } } },
        remote,
        meta: { store },
      },
    } = this.props

    if (store) { // Look for conditional outputs
      Object.entries(store).forEach(([storeKey, storeValue]) => {
        if (typeof (storeValue) === 'string' && storeValue.startsWith('if')) {
          let tempStore = store[storeKey]
          const variables = tempStore.match(/\$(\w+)(?!\w)/g) // find variables, variables starts with '$'
          variables.map(variable => tempStore = tempStore.replace(variable, value[variable.slice(1)])) // replace variables with their value
          store[storeKey] = eval(tempStore)
        }
      })
    }

    const formValues = form.getValue()

    let fileUri
    Object.values(formValues).forEach((value) => {
      if (Array.isArray(value) && value.length > 0) {
        if (value[0].uri) fileUri = value[0].uri
      }
    })

    if (formValues === null) {
      return onSubmit('Form validation failed')
    }

    // No remote update
    if (!remote || remote.length === 0) {
      return onSubmit({ ...store }, null, actionComment)
    }

    this.setState({ inFlight: true })

    if (fileUri) {
      Papa.parse(fileUri, {
        download: true,
        header: true,
        complete: data => this.processMassUpload(data, actionComment),
      })
    } else {
      return onSubmit(null, 'File not found', actionComment)
    }
  }

}

MassUpload.transformer = undefinedTransformer

export default MassUpload
