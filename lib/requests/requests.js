import { createApolloFetch } from 'apollo-fetch'
import stringTemplate from 'string-template'
import { getPayloadError } from 'getpayload'
import objectToFormData         from 'object-to-formdata'

// Implements recursive object serialization according to JSON spec but without quotes around the keys.
function stringify(obj_from_json, depth = 0) {
  if (typeof obj_from_json !== 'object' || Array.isArray(obj_from_json)) {
    // not an object, stringify using native function
    return JSON.stringify(obj_from_json)
  }

  depth += 1

  if (depth > 1 && typeof obj_from_json === 'object') {
    const props = Object
      .keys(obj_from_json)
      .map(key => `{${key}:${stringify(obj_from_json[key], depth)}}`)
      .join(',')
    return `${props}`
  }
  const props = Object
    .keys(obj_from_json)
    .map(key => `${key}:${stringify(obj_from_json[key], depth)}`)
    .join(',')
  return `${props}`
}

function isString(item) {
  return typeof item === 'string'
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

async function processRemoteUpdateGraphQL(uri, body, meta) {
  body = JSON.stringify(body, (key, value) => (value === null ? '' : value))
  const body_json = JSON.parse(body)
  const body_query = stringify(body_json)

  const apolloFetch = createApolloFetch({ uri })

  apolloFetch.useAfter(({ response }, next) => {
    if (response.parsed.errors) {
      throw response.parsed.errors[0]
    }
    next()
  })
  if (meta.graphql.method) {
    const response_fields = meta.graphql.response_fields ? meta.graphql.response_fields.join(' ') : '_id'
    const mutation = `mutation { response: ${meta.graphql.method}(${body_query}) {${response_fields}} }`

    return apolloFetch({ query: mutation })
  }

  // method not in method (retrocompatibility)
  const mutation = `mutation { ${meta.graphql}(${body_query}) {response message} }`

  return apolloFetch({ query: mutation }).then(resp => resp)

}

async function processRemoteUpdateRest(uri, body, contentType, headers, meta) {

  if (contentType === 'application/json') body = JSON.stringify(body, (key, value) => (value === null ? '' : value))
  else body = objectToFormData(body)


  return fetch(uri, {
    method: 'POST',
    headers,
    body,
  })
    .then(getPayloadError).then(resp => resp)

}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) { // eslint-disable-line
    await callback(array[index], index, array) // eslint-disable-line
  }
}

function getFieldName(key) {
  if (isString(key)) return key

  return Object.values(key)[0]
}

async function processListRemoteUpdate(remote, formValues) {

  const responses = []
  const responsesFn = async () => {
    await asyncForEach(remote, async (remoteObject) => {
      const { meta, uri } = remoteObject
      const { headers = {}, contentType = 'multipart/form-data', updateFields } = meta
      let postBody = Object.assign({}, formValues)

      // set fields sent to graphql resolver accessing form values and/or previous response
      // if not informed it will select all values from the form
      if (updateFields) {
        postBody = Object.keys(postBody)
          .filter(field => updateFields.includes(field))
          .reduce((obj, field) => {return { ...obj, [field]: postBody[field] } }, {}) // eslint-disable-line

        const previousFields = updateFields.filter(field => getFieldName(field).includes('_prev'))
        if (previousFields.length > 0) {
          previousFields.forEach((previusField) => {
            const splitArray = getFieldName(previusField).split('.')
            const nameField = splitArray[splitArray.length - 1]
            const indexResponse = parseInt(getFieldName(previusField).split('[')[1].split(']')[0], 10)
            postBody[nameField] = responses[indexResponse].data.response[nameField]
          })
        }

        // encapsulate fields in objects if necessary
        const objectsUpdateFields = updateFields.filter(key => !isString(key))
        objectsUpdateFields.forEach((objectField) => {
          let fieldName = getFieldName(objectField)
          if (fieldName.startsWith('_prev[')) {
            fieldName = fieldName.split('.')[1] // eslint-disable-line
          }
          postBody[Object.keys(objectField)[0]] = Object.assign({}, { [fieldName]: formValues[fieldName] })
        })
      }

      let response
      // Graphql API
      if (meta.graphql) {
        response = await processRemoteUpdateGraphQL(uri, postBody, meta)

        responses.push(response)
      } else {
        responses.push(await processRemoteUpdateRest(uri, postBody, contentType, headers, meta))
      }

    })

    return responses
  }
  return Promise.all(await responsesFn())

}

export {
  processRemoteRequests,
  processRemoteUpdateGraphQL,
  processRemoteUpdateRest,
  processListRemoteUpdate,
}
