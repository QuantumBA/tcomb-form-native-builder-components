const fetchMock = require('fetch-mock')

const processSchema = require('../lib/processSchema')


afterEach(fetchMock.restore())


test('remote `select` definition', async function()
{
  fetchMock.getOnce('*', require('./fixtures/response.json'))

  const result = await processSchema(require('./fixtures/request.json'))

  expect(fetchMock.lastUrl()).toBe('/blah?value=foo')
  expect(result.enum).toEqual({'1234': 'loren ipsum'})
})
