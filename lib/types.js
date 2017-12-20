import React           from 'react'
import {Button, Image} from 'react-native'
import t               from 'tcomb-form-native/lib'


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
  return function({options})
  {
    const {form, style, title, uri} = options
    const {onSubmit} = form.props.options

    function onPress()
    {
      const body = form.getValue()
      if(body === null) return  // Form validation failed

      fetch(uri, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
      })
      .then(res => res.json().then(payload => res.ok ? payload : Promise.reject(payload)))
      .then(onSubmit, console.error)  // TODO show error in template
    }

    return <Button style={style} title={title} onPress={onPress}/>
  }
}


exports.image  = image
exports.submit = submit
