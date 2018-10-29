import { getPayloadError } from 'getpayload'
import mixinDeep from 'mixin-deep'
import objectPath from 'object-path'
import stringTemplate from 'string-template'
import { createApolloFetch } from 'apollo-fetch'


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

async function processChildrens(json, childrens, filter, processor) {
  const keys = Object.keys(childrens).filter(filter, childrens)

  keys.forEach(function (key, index) { // eslint-disable-line
    json[key] = this[index]
  },
  await Promise.all(keys.map(processor)))
}

function processEnumDefinition(json, fieldId = 'id', fieldLabel = 'label', path) {
  // Check `enum` definitions is of valid types
  if (!(Array.isArray(json) || isLiteralObject(json))) {
    throw new TypeError(`\`json\` must be array or object, got ${
      json.constructor.name}`)
  }

  // Object with data not on root
  if (path) json = objectPath.get(json, path)

  // null / undefined
  if (json == null) throw new TypeError('`enum` is null or undefined')

  // object
  if (isLiteralObject(json)) {
    const values = Object.values(json)

    if (!values.length) throw new TypeError('`json` is empty object')

    // Standard `id:label` object
    if (values.every(isString)) return json
  } else if (Array.isArray(json)) { // Array
    if (!json.length) throw new TypeError('`json` is empty array')

    // Standard array of strings
    if (json.every(isString)) return json

    // Array of objects, convert to `id:label` object
    return json.reduce((acum, item) => {
      item = objectPath(item)

      const id = item.get(fieldId)
      if (id == null) throw new Error('`id` is null or undefined')

      const label = item.get(fieldLabel)
      if (label == null) throw new Error('`label` is null or undefined')

      acum[id] = label

      return acum
    }, {})
  }

  // unknown type
  throw new TypeError('`enum` definition format is unknown')
}

function proccessResponseDefinition(json, fieldLabel = 'label', path) {
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

async function processRemoteRequests(uriTemplate, stackedPlaceholders, headers, body = undefined) {
  let response = {}
  const input = stringTemplate(uriTemplate, stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${') // eslint-disable-line
  // Fetch `select` remote entries definition
  if (!body) {
    // TODO use already defined `enum` value as default in case of error?
    response = await fetch(input, { headers }).then(getPayloadError)
  } else {
    const apolloFetch = createApolloFetch({
      uri: uriTemplate,
    })

    response = await apolloFetch({ query: body })
  }
  return response
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
  if (type === 'string' || type === 'number') {
    // process variable in meta before making requests
    if ('meta' in json) {
      await processChildrens(json.meta, json.meta, filterStrings,
        key => stringTemplate(json.meta[key], stackedPlaceholders, /\$\{([0-9a-zA-Z_\.]+)\}/g, '${')) // eslint-disable-line
    }

    const {
      fieldId,
      fieldLabel,
      headers,
      uri: metaUri,
      body,
      path,
    } = json.meta || {}


    const uriTemplate = metaUri || uri
    if (uriTemplate) {
      response = await processRemoteRequests(uriTemplate, stackedPlaceholders, headers, body)

      if (!enumInfo) json.value = proccessResponseDefinition(response, fieldLabel, path)
    }
    // Convert `select` definition
    if (enumInfo) {
      enumInfo = response || enumInfo
      json.enum = processEnumDefinition(enumInfo, fieldId, fieldLabel, path)
    }
  }
  // Process children node objects recursively in parallel
  await processChildrens(json, childrens, filterObjects,
    key => processSchema.call(stackedPlaceholders, json[key]))

  // Return processed json
  return json
}

module.exports = processSchema
