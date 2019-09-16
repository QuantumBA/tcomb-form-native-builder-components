import mixinDeep from 'mixin-deep'
import objectPath from 'object-path'
import stringTemplate from '@foqum/string-template'
import { createApolloFetch } from 'apollo-fetch'
import { processRemoteRequests } from 'tcomb-form-native-builder-utils'


function filterObjects(element) {
  return isLiteralObject(this[element])
}

function filterStrings(element) {
  return isString(this[element])
}

function isLiteralObject(item) {
  return item && item.constructor.name === 'Object'
}

function isString(item) {
  return typeof item === 'string'
}

function isISODate(string) {
  const date = new Date(string)
  return !isNaN(date) && date.toISOString() === string
}

function calculateExpression(field) {
  // eval if exp contains only digits and basic operators
  if (/^[\d+.\-*\/\(\)]*$/.test(field.value)) {
    try {
      console.warn('evaluating', field.value)
      field.value = eval(field.value)
    } catch (e) {
      console.error(e)
    }
  }
}

async function loadObjectFields(fields, obj, stackedPlaceholders) {
  const uri = stringTemplate(obj.uri, stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${') // eslint-disable-line
  const apolloFetch = createApolloFetch({ uri })
  await apolloFetch({ query: obj.query.replace('${fields}', fields)}) // eslint-disable-line
    .then((res) => {
      // Graphql type name
      const key = Object.keys(res.data)[0]
      Object.entries(res.data[key][0]).forEach(([k, v]) => {
        // load into widget_context.object
        obj[k] = v == null ? '' : v
      })
    })
}

function objectArray2Object(objectArray, fieldId, fieldLabel, omitNullVal = false) {
  // transform: [{'id': '0', 'label': 'a'}, {'id': '1', 'label': 'b'}]
  // into     : {'0': 'a', '1': 'b'}

  const result = {}
  objectArray.forEach((item) => {
    item = objectPath(item)

    const id = item.get(fieldId)
    const label = item.get(fieldLabel)

    if (omitNullVal) {
      if (id !== null && label !== null) result[id] = label
    } else {
      if (id == null) throw new Error('`id` is null or undefined')
      if (label == null) throw new Error('`label` is null or undefined')
      result[id] = label
    }
  })
  return result
}

async function processChildrens(json, childrens, filter, processor) {
  const keys = Object.keys(childrens).filter(filter, childrens)

  keys.forEach(function (key, index) { // eslint-disable-line
    json[key] = isISODate(this[index]) ? new Date(this[index]) : this[index]
  },
  await Promise.all(keys.map(processor)))
}

function processEnumDefinition(enumInfo, fieldId = 'id', fieldLabel = 'label', path, omitNullVal = false) {

  // Check `enum` definitions is of valid types
  if (!(Array.isArray(enumInfo) || isLiteralObject(enumInfo))) {
    throw new TypeError(`\`enumInfo\` must be array or object, got ${
      enumInfo.constructor.name}`)
  }

  // Object with data not on root
  if (path) enumInfo = objectPath.get(enumInfo, path)

  if (enumInfo == null) throw new TypeError('`enum` is null or undefined')

  // object
  if (isLiteralObject(enumInfo)) {
    const values = Object.values(enumInfo)

    if (!values.length) throw new TypeError('`enumInfo` is empty object')

    // Standard `id:label` object
    if (values.every(isString)) {
      return enumInfo
    }
  } else if (Array.isArray(enumInfo)) { // Array
    if (!enumInfo.length && path !== undefined) throw new TypeError('`enumInfo` is empty array')

    // Standard array of strings
    if (enumInfo.every(isString)) return enumInfo

    // Array of objects, convert to `id:label` object
    return objectArray2Object(enumInfo, fieldId, fieldLabel, omitNullVal)
  }

  // unknown type
  throw new TypeError('`enum` definition format is unknown')
}

function processResponseDefinition(json, fieldLabel = 'label', path) {
  if (!(isLiteralObject(json))) {
    throw new TypeError(`\`json\` must be an object, got ${
      json.constructor.name}`)
  }

  // Object with data not on root
  if (path) json = objectPath.get(json, path)

  // null / undefined
  if (json == null) throw new TypeError('`string` is null or undefined')

  if (!(fieldLabel in json)) throw new TypeError('`key` is not in object')

  return json[fieldLabel]
}

/**
 * @param {Object} json
 */
async function processSchema(json) {
  const {
    meta: {
      placeholders,
    } = {},
    type,
    uri,
    ...childrens
  } = json

  // Fill placeholders in string values
  const stackedPlaceholders = mixinDeep({}, placeholders, this)

  if (json.preprocessing && json.preprocessing.objectFields) {
    await loadObjectFields(json.preprocessing.objectFields, this.object, stackedPlaceholders)
  }

  await processChildrens(json, childrens, filterStrings,
    key => stringTemplate(json[key], stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${')) // eslint-disable-line

  if (type === 'number') calculateExpression(json)

  // Process `select`
  let response
  let enumInfo = json.enum
  let { suggestions } = json
  if (type === 'string' || type === 'number' || type === 'array') {
    // process variable in meta before making requests
    if ('meta' in json) {
      await processChildrens(json.meta, json.meta, filterStrings,
        key => stringTemplate(json.meta[key], stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${')) // eslint-disable-line
    }

    const {
      fieldId,
      fieldLabel,
      headers,
      body,
      path,
      dependencies,
    } = json.meta || {}


    const uriTemplate = uri

    // if the field has dependencies there should not be any loads until its dependencies have values
    if (uriTemplate && !dependencies) {
      response = await processRemoteRequests(uriTemplate, stackedPlaceholders, headers, body)

      if (!enumInfo && !suggestions) {
        json.value = processResponseDefinition(response, fieldLabel, path)
        const date = new Date(Date.parse(json.value))
        if (!isNaN(date) && date.toISOString() === String(json.value)) {
          json.value = date
        }
      }
    }
    // Convert `select` definition
    if (enumInfo) {
      enumInfo = response || enumInfo

      // if there are no dependencies in the enum then its path shuoldn't be interpreted
      json.enum = processEnumDefinition(enumInfo, fieldId, fieldLabel, !dependencies ? path : undefined, json.omitNullVal)
    }
    if (suggestions) {
      suggestions = response || suggestions

      // if there are no dependencies in the enum then its path shuoldn't be interpreted
      json.suggestions = processEnumDefinition(suggestions, fieldId, fieldLabel, !dependencies ? path : undefined, json.omitNullVal)
    }

  }
  // Process children node objects recursively in parallel
  await processChildrens(json, childrens, filterObjects,
    key => processSchema.call(stackedPlaceholders, json[key]))

  // Return processed json
  return json
}

module.exports = processSchema
