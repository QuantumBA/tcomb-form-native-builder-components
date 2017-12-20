import React           from 'react'
import {Button, Image} from 'react-native'
import t               from 'tcomb-form-native/lib'

const objectToFormData = require('object-to-formdata')


const image = t.subtype(t.Str, s => s, 'image')
image.getTcombFormFactory = function()
{
  return function({options})
  {
    const {style, uri} = options

    return <Image style={style} source={{uri}}/>
  }
}

const submit = t.subtype(t.Str, s => s, 'submit')
submit.getTcombFormFactory = function()
{
  return function({error, hasError, help, options, stylesheet})
  {
    const {form, style, title, uri} = options
    const {onSubmit} = form.props.options

    let contentType = options.contentType || "multipart/form-data"

    function onPress()
    {
      const body = form.getValue()
      if(body === null) return  // Form validation failed

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
      .then(onSubmit, console.error)  // TODO show error in template
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
      <Viev style={formGroupStyle}>
        <Button style={style} title={title} onPress={onPress}/>
        {help}
        {error}
      <Viev>
    )
  }
}


exports.image  = image
exports.submit = submit
