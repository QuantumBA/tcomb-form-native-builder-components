const objectPath     = require('object-path')
const stringTemplate = require('string-template')


function isString(item)
{
  return typeof item === 'string'
}


function processEnumDefinition(fieldId = 'id', fieldValue = 'value', json)
{
  if(!Array.isArray(json) || json.every(isString)) return json

  return json.reduce(function(acum, item)
  {
    item = objectPath(item)

    return {...acum, [item.get(fieldId)]: item.get(fieldValue)}
  }, {})
}


async function processSchema(json)
{
  const {fieldId, fieldValue, placeholders, type, uri, ...childrens} = json
  let enumInfo = json.enum

  // Process `select` with remote entries definition
  if(type === 'string' && enumInfo && uri)
    try
    {
      enumInfo = await fetch(stringTemplate(uri, placeholders))
      .then(res => res.json())
    }
    catch(e)
    {
      console.error(e)
    }

  // Convert `select` defined as array of objects
  if(enumInfo)
    json.enum = processEnumDefinition(fieldId, fieldValue, enumInfo)

  // Process childrens nodes recursively in parallel
  if(typeof json === 'object')
  {
    const keys = Object.keys(childrens)

    keys.forEach(function(key, index)
    {
      json[key] = this[index]
    },
    await Promise.all(keys.map(key => processSchema(json[key]))))
  }

  // Return processed json
  return json
}


module.exports = processSchema
