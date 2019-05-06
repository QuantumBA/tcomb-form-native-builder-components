
function arrayStringsFactory(splitter = /\s+/, joiner = ' ') {
  return {
    format(value) {
      return Array.isArray(value) ? value.join(joiner) : value
    },

    parse(str) {
      return str ? str.split(splitter) : []
    },
  }
}

const undefinedTransformer = {
  format: () => {},
  parse: () => {},
}

exports.arrayStringsFactory = arrayStringsFactory
exports.undefinedTransformer = undefinedTransformer
