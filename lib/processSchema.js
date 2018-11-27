import mixinDeep from 'mixin-deep'
import objectPath from 'object-path'
import stringTemplate from 'string-template'
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

function objectArray2Object(objectArray, fieldId, fieldLabel) {
  return objectArray.reduce((acum, item) => {
    item = objectPath(item)

    const id = item.get(fieldId)
    if (id == null) throw new Error('`id` is null or undefined')

    const label = item.get(fieldLabel)
    if (label == null) throw new Error('`label` is null or undefined')

    acum[id] = label

    return acum
  }, {})
}

async function processChildrens(json, childrens, filter, processor) {
  const keys = Object.keys(childrens).filter(filter, childrens)

  keys.forEach(function (key, index) { // eslint-disable-line
    json[key] = this[index]
  },
  await Promise.all(keys.map(processor)))
}

function processEnumDefinition(enumInfo, fieldId = 'id', fieldLabel = 'label', path) {
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
    if (!enumInfo.length) throw new TypeError('`enumInfo` is empty array')

    // Standard array of strings
    if (enumInfo.every(isString)) return enumInfo

    // Array of objects, convert to `id:label` object
    return objectArray2Object(enumInfo, fieldId, fieldLabel)
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

  await processChildrens(json, childrens, filterStrings,
    key => stringTemplate(json[key], stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${')) // eslint-disable-line


  // Process `select`
  let response
  let enumInfo = json.enum
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

      if (!enumInfo) {
        json.value = processResponseDefinition(response, fieldLabel, path)
        const date = new Date(Date.parse(json.value))
        if (!isNaN(date) && date.toISOString() === String(json.value)){
          json.value = date.toLocaleDateString()
        }
      }
    }
    // Convert `select` definition
    if (enumInfo) {
      enumInfo = response || enumInfo

      // if there are no dependencies in the enum then its path shuoldn't be interpreted
      json.enum = processEnumDefinition(enumInfo, fieldId, fieldLabel, !dependencies ? path : undefined)
    }
  }
  // Process children node objects recursively in parallel
  await processChildrens(json, childrens, filterObjects,
    key => processSchema.call(stackedPlaceholders, json[key]))

  // Return processed json
  return json
}

module.exports = processSchema
