import objectToFormData     from 'object-to-formdata'
import React                from 'react'
import {Button, Text, View} from 'react-native'
import t                    from 'tcomb-form-native/lib'

const {Component} = t.form


class Submit extends Component
{
  getTemplate()
  {
    return ({error, hasError, help, stylesheet}) =>
    {
      // TODO fill `help` local someway (if needed)

      const {options} = this.props
      const {form, style, title, uri} = options
      const {onSubmit} = form.props.options

      let contentType = options.contentType || "multipart/form-data"

      const onPress = () =>
      {
        this.removeErrors()
        this.setState({inFlight: false})

        let body = form.getValue()
        if(body === null)
          return this.setState({error: 'Form validation failed'})

        if(contentType === "application/json")
          body = JSON.stringify(body)
        else
          body = objectToFormData(body)

        fetch(uri, {
          method: "POST",
          headers: {"Content-Type": contentType},
          body
        })
        .then(res => res.json().then(payload => res.ok ? payload : Promise.reject(payload)))
        .then(onSubmit, error => this.setState({error}))
        .then(() => this.setState({inFlight: false}))
      }

      let formGroupStyle  = stylesheet.formGroup.normal
      let helpBlockStyle  = stylesheet.helpBlock.normal
      let errorBlockStyle = stylesheet.errorBlock

      if(hasError)
      {
        formGroupStyle = stylesheet.formGroup.error
        helpBlockStyle = stylesheet.helpBlock.error
      }

      help = help ? <Text style={helpBlockStyle}>{help}</Text> : null
      error = hasError && error ? (
        <Text accessibilityLiveRegion="polite" style={errorBlockStyle}>
          {error}
        </Text>
      ) : null

      return (
        <View style={formGroupStyle}>
          <Button style={style} title={title} onPress={onPress}/>
          {help}
          {error}
        </View>
      )
    }
  }
}


exports.Submit = Submit
