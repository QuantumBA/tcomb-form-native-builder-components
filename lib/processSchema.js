const objectPath     = require('object-path')
const stringTemplate = require('string-template')


function isString(item)
{
  return typeof item === 'string'
}


function processEnumDefinition(json, fieldId = 'id', fieldValue = 'value', path)
{
  if(!Array.isArray(json)) json = objectPath.get(json, path)

  if(!Array.isArray(json) || json.every(isString)) return json

  return json.reduce(function(acum, item)
  {
    item = objectPath(item)

    return {...acum, [item.get(fieldId)]: item.get(fieldValue)}
  }, {})
}


async function processSchema(json)
{
  const {meta, type, uri, ...childrens} = json
  let enumInfo = json.enum

  // Process `select`
  if(type === 'string' && enumInfo && (meta || uri))
  {
    const {fieldId, fieldValue, headers, uri: metaUri, path, placeholders} = (meta || {})

    // Process `select` with remote entries definition
    const uriTemplate = metaUri || uri
    if(uriTemplate)
    {
      const input = stringTemplate(uriTemplate, placeholders)

      try
      {
        enumInfo = await fetch(input, {headers}).then(res => res.json())
      }
      catch(e)
      {
        console.error(e)
      }
    }

    // Convert `select` defined as array of objects
    if(enumInfo)
      json.enum = processEnumDefinition(enumInfo, fieldId, fieldValue, path)
  }

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
