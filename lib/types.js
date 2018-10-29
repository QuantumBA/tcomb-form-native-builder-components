import t from 'tcomb-form-native/lib'

import { Chips, Files, Image, Submit } from './factories/factories'


function isFile(x) {
  return x != null
      && x.name != null
      // && x.size != null
      // && x.type != null
      && x.uri != null
}


const chips = t.list(t.String, 'chips')
chips.getTcombFormFactory = () => Chips

const files = t.subtype(t.Array, x => x.every(isFile))
files.getTcombFormFactory = () => Files

const image = t.subtype(t.Nil, () => true, 'image')
image.getTcombFormFactory = () => Image

const submit = t.subtype(t.Nil, () => true, 'submit')
submit.getTcombFormFactory = () => Submit


export { chips, files, image, submit, files as file }
