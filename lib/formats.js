import t from 'tcomb-form-native/lib'

// Custom form field formats, usage:
// "email": {
//   "type": "string",
//   "label": "Email",
//   "format": "email",
//   "error": "Invalid email"
// },

function isEmail(x) {
  return /(.)+@(.)+/.test(x)
}

const date = t.Date
const email = isEmail

export { date, email }
