import { createApolloFetch } from 'apollo-fetch'
import stringTemplate from 'string-template'
import { getPayloadError } from 'getpayload'

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

async function processRemoteUpdate(uriTemplate, stackedPlaceholders, headers, body = undefined){
  return null
}

export { processRemoteRequests, processRemoteUpdate }
