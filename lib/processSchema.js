const objectPath     = require("object-path")
const stringTemplate = require("string-template")


function isString(item)
{
  return typeof item === 'string'
}


function processEnumDefinition(field_id = 'id', field_value = 'value', json)
{
  if(!Array.isArray(json) || json.every(isString)) return json

  return json.reduce(function(acum, item)
  {
    item = objectPath(item)

    return {...acum, [item.get(field_id)]: item.get(field_value)}
  }, {})
}


async function processSchema(json)
{
  const {enum, field_id, field_value, placeholders, type, uri, ...childrens} = json

  // Process `select` with remote entries definition
  if(type === 'string' && typeof enum === 'string')
    try
    {
      json.enum = await fetch(stringTemplate(uri, placeholders))
      .then(res => res.json())
      .then(processEnumDefinition.bind(null, field_id, field_value))
    }
    catch(e)
    {
      console.error(e)
    }

  // Process childrens nodes recursively
  for(let key in childrens)
    json[key] = processSchema(json[key])

  // Return processed json
  return json
}


module.exports = processSchema
