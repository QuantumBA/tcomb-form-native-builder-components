import React                    from 'react'

import { Button, Text, View }   from 'react-native'
import t                        from 'tcomb-form-native/lib'
import { processListRemoteUpdate } from 'tcomb-form-native-builder-utils'
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

  confirmAction(actionComment) {
    const {
      options: {
        form,
        form: { props: { options: { onSubmit, requestUploadUrl, url, stackedPlaceHolders } } },
        remote,
        meta: { uploadToS3, store, fieldsToStore, query, summaryFields, graphqlURI },
      },
    } = this.props

    const formValues = form.getValue()
    if (formValues === null) {
      return onSubmit('Form validation failed')
    }

    // No remote update
    if (!remote) {
      return onSubmit({ ...store }, null, actionComment)
    }

    let responses

    this.setState({ inFlight: true })

    processListRemoteUpdate(remote, formValues, stackedPlaceHolders)
      .then((resp) => {
        responses = resp
        const responseStore = Object.assign({}, resp[0].data)
        if (fieldsToStore) {
          responseStore.response = {}
          fieldsToStore.forEach((field) => {
            const fieldSplit = field.split(':')
            responseStore.response[fieldSplit[1]] = resp[fieldSplit[0]].data.response[fieldSplit[1]]
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
        onSubmit({ ...responseStore, ...store }, null, actionComment)
      }, error => onSubmit(null, error, actionComment))
      .then(() => {
        if (uploadToS3) {
          const fieldSplit = uploadToS3.data_uid.split(':')
          const urlSplit = url.split('/')
          if (Array.isArray(responses[fieldSplit[0]].data.response)) {
            const data_uid = responses[fieldSplit[0]].data.response

            let i = 0
            formValues[fieldSplit[1]].forEach((record) => {
              record[uploadToS3.field].forEach((file) => {
                const data_id = data_uid[i][fieldSplit[2]]
                setTimeout(() => requestUploadUrl({
                  data_uid: data_id,
                  filename: file.name,
                  mime_type: file.type,
                  node_uid: urlSplit[2], // module_id obtained from the url
                  label: fieldSplit[2],
                }).then(({ upload_url }) => fetch(upload_url, {
                  method: 'PUT',
                  headers: {
                    'x-amz-acl': 'public-read',
                    'Content-Type': file.type,
                  },
                  body: file,
                })), 2000)
              })
              i += 1
            })
          } else {
            const data_uid = responses[fieldSplit[0]].data.response[fieldSplit[1]]
            formValues[uploadToS3.field].forEach((file) => {
              setTimeout(() => requestUploadUrl({
                data_uid,
                filename: file.name,
                mime_type: file.type,
                node_uid: urlSplit[2], // module_id obtained from the url
                label: fieldSplit[1],
              }).then(({ upload_url }) => fetch(upload_url, {
                method: 'PUT',
                headers: {
                  'x-amz-acl': 'public-read',
                  'Content-Type': file.type,
                },
                body: file,
              })), 2000)
            })
          }
        }
      })
      .then(() => this._isMounted && this.setState({ inFlight: false }))
  }

}

Submit.transformer = undefinedTransformer

export default Submit
