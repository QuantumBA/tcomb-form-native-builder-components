import React           from 'react'
import {Button, Image} from 'react-native'
import t               from 'tcomb-form-native/lib'

import {Submit} from './factories'


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
  return Submit
}


exports.image  = image
exports.submit = submit
