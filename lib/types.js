import t from 'tcomb-form-native/lib'

import { ActionSwitch, Chips, Files, Image, Submit } from './factories/factories'

// Custom form fields, usage:
// "myFile": {
//   "type": "file",
//   "label": "Upload files"
// }

function isFile(x) {
  return x != null
      && x.name != null
}


const chips = t.list(t.String, 'chips')
chips.getTcombFormFactory = () => Chips

const files = t.subtype(t.Array, x => x.every(isFile))
files.getTcombFormFactory = () => Files

const image = t.subtype(t.Nil, () => true, 'image')
image.getTcombFormFactory = () => Image

const submit = t.subtype(t.Nil, () => true, 'submit')
submit.getTcombFormFactory = () => Submit

const actionSwitch = t.subtype(t.Nil, () => true, 'actionSwitch')
actionSwitch.getTcombFormFactory = () => ActionSwitch

export { actionSwitch, chips, files, image, submit, files as file }
