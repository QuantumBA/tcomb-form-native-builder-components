import t from 'tcomb-form-native/lib'

import {Chips, Files, Image, Submit} from './factories'


function isFile(x)
{
  return x instanceof File
}


const chips = t.list(t.String, 'chips')
chips.getTcombFormFactory = function()
{
  return Chips
}

const files = t.subtype(t.Array, function(x){return x.every(isFile)})
files.getTcombFormFactory = function()
{
  return Files
}

const image = t.subtype(t.Nil, s => true, 'image')
image.getTcombFormFactory = function()
{
  return Image
}

const submit = t.subtype(t.Nil, s => true, 'submit')
submit.getTcombFormFactory = function()
{
  return Submit
}


exports.chips  = chips
exports.files  = files
exports.image  = image
exports.submit = submit

exports.file = files  // deprecated
