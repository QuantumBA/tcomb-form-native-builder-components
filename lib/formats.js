import t from 'tcomb-form-native/lib'


function isEmail(x) {
  return /(.)+@(.)+/.test(x)
}

const date = t.Date
const email = isEmail

export { date, email }
