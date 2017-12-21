import React           from 'react'
import t               from 'tcomb-form-native/lib'
import {Button} from 'react-native'

import {Image, Submit} from './factories'


const image = t.subtype(t.Str, s => s, 'image')
image.getTcombFormFactory = function()
{
  return Image
}

const submit = t.subtype(t.Str, s => s, 'submit')
submit.getTcombFormFactory = function()
{
  return Submit
}


exports.image  = image
exports.submit = submit
