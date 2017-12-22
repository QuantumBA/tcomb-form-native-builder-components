import React           from 'react'
import t               from 'tcomb-form-native/lib'
import {Button} from 'react-native'

import {File as FileFactory, Image, Submit} from './factories'


const file = t.irreducible('File', function(x){return x instanceof File})
file.getTcombFormFactory = function()
{
  return FileFactory
}

const image = t.subtype(t.Nil, s => s, 'image')
image.getTcombFormFactory = function()
{
  return Image
}

const submit = t.subtype(t.Nil, s => s, 'submit')
submit.getTcombFormFactory = function()
{
  return Submit
}


exports.file   = file
exports.image  = image
exports.submit = submit
