import t from 'tcomb-form-native/lib'


function isEmail(x) {
  return /(.)+@(.)+/.test(x)
}


exports.date = t.Date
exports.email = isEmail
