function getPayload(res)
{
  const contentType = res.headers.get("content-type")

  if(contentType)
  {
    if(contentType.includes("application/json"))
      return res.json()

    return res.text()
  }

  // TODO according to spec, we should try to guess the correct content-type

  return res.arrayBuffer()
}

function getPayloadError(res)
{
  return getPayload(res)
  .then(payload => res.ok ? payload : Promise.reject(payload))
}


exports.getPayload      = getPayload
exports.getPayloadError = getPayloadError
