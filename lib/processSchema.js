const {getPayloadError} = require('getpayload')
const objectPath        = require('object-path')
const stringTemplate    = require('string-template')


function filterObjects(element)
{
  return isLiteralObject(this[element])
}

function filterStrings(element)
{
  return isString(this[element])
}

function isLiteralObject(item)
{
  return item && item.constructor.name === 'Object'
}

function isString(item)
{
  return typeof item === 'string'
}


async function processChildrens(json, childrens, filter, processor)
{
  const keys = Object.keys(childrens).filter(filter, childrens)

  keys.forEach(function(key, index)
  {
    json[key] = this[index]
  },
  await Promise.all(keys.map(processor)))
}

function processEnumDefinition(json, fieldId = 'id', fieldLabel = 'label', path)
{
  // Check `enum` definitions is of valid types
  if(!(Array.isArray(json) || isLiteralObject(json)))
    throw new TypeError('`json` must be array or object, got '+
                        json.constructor.name)

  // Object with data not on root
  if(path) json = objectPath.get(json, path)

  // null / undefined
  if(json == null) throw new TypeError('`enum` is null or undefined')

  // object
  if(isLiteralObject(json))
  {
    const values = Object.values(json)

    if(!values.length) throw new TypeError('`json` is empty object')

    // Standard `id:label` object
    if(values.every(isString)) return json
  }

  // Array
  else if(Array.isArray(json))
  {
    if(!json.length) throw new TypeError('`json` is empty array')

    // Standard array of strings
    if(json.every(isString)) return json

    // Array of objects, convert to `id:label` object
    return json.reduce(function(acum, item)
    {
      item = objectPath(item)

      const id = item.get(fieldId)
      if(id == null) throw new Error('`id` is null or undefined')

      const label = item.get(fieldLabel)
      if(label == null) throw new Error('`label` is null or undefined')

      acum[id] = label

      return acum
    }, {})
  }

  // unknown type
  throw new TypeError('`enum` definition format is unknown')
}


/**
 * @param {Object} json
 */
async function processSchema(json)
{
  const {
    meta: {
      fieldId,
      fieldLabel,
      headers,
      uri: metaUri,
      path,
      placeholders = {}
    } = {},
    type,
    uri,
    ...childrens
  } = json

  // Fill placeholders in string values
  if(this !== undefined)
    Object.setPrototypeOf(placeholders, this)

  await processChildrens(json, childrens, filterStrings,
                         key => stringTemplate(json[key], placeholders))

  // Process `select`
  let enumInfo = json.enum
  if(type === 'string' && enumInfo)
  {
    // Fetch `select` remote entries definition
    const uriTemplate = metaUri || uri
    if(uriTemplate)
    {
      const input = stringTemplate(uriTemplate, placeholders)

      // TODO use already defined `enum` value as default in case of error?
      enumInfo = await fetch(input, {headers}).then(getPayloadError)
    }

    // Convert `select` definition
    json.enum = processEnumDefinition(enumInfo, fieldId, fieldLabel, path)
  }

  // Process children node objects recursively in parallel
  await processChildrens(json, childrens, filterObjects,
                         key => processSchema.call(placeholders, json[key]))

  // Return processed json
  return json
}


module.exports = processSchema
