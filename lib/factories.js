import objectToFormData                          from 'object-to-formdata'
import React                                     from 'react'
import {Button, Image as ReactImage, Text, View} from 'react-native'
import t                                         from 'tcomb-form-native/lib'

const {Component} = t.form


class Image extends Component
{
  getTemplate()
  {
    const {options} = this.props
    const {style, uri} = options

    return function()
    {
      return <ReactImage style={style} source={{uri}}/>
    }
  }
}

class Submit extends Component
{
  _onPress = () =>
  {
    const {options} = this.props
    const {form, uri} = options
    const {onSubmit} = form.props.options

    const contentType = options.contentType || "multipart/form-data"

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

  getTemplate()
  {
    const {style, title} = this.props.options

    return ({error, hasError, help, stylesheet}) =>
    {
      // TODO fill `help` local someway (if needed)

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
          <Button style={style} title={title} onPress={this._onPress}/>
          {help}
          {error}
        </View>
      )
    }
  }
}


exports.Image  = Image
exports.Submit = Submit
