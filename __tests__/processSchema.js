const fetchMock = require('fetch-mock')

const processSchema = require('../lib/processSchema')


afterEach(fetchMock.restore)


describe('remote `select` definition', function()
{
  test('meta', async function()
  {
    fetchMock.getOnce('*', require('./fixtures/response.json'))

    const result = await processSchema(require('./fixtures/schema.json'))

    expect(fetchMock.lastUrl()).toBe('/blah?value=foo')
    expect(result.enum).toEqual({'1234': 'loren ipsum'})
  })

  test('no meta', async function()
  {
    fetchMock.getOnce('*', require('./fixtures/response2.json'))

    const result = await processSchema(require('./fixtures/schema2.json'))

    expect(fetchMock.lastUrl()).toBe('/blah?value=foo')
    expect(result.enum).toEqual({'1234': 'loren ipsum'})
  })
})

describe('bad enum definition', function()
{
  test('complex object without mapping', async function()
  {
    const promise = processSchema(require('./fixtures/schema3.json'))

    return expect(promise).rejects.toHaveProperty('message', '`enum` definition format is unknown')
  })

  test('string', async function()
  {
    const promise = processSchema(require('./fixtures/schema4.json'))

    return expect(promise).rejects.toThrow('`json` must be array or object, got String')
  })
})

test('child nodes', async function()
{
  const result = await processSchema(require('./fixtures/schema5.json'))

  expect(result.enum).toEqual({'id': 'label'})
  expect(result.foo.enum).toEqual({'id': 'label'})
})

describe('stacked placeholders', function()
{
  test('this', async function()
  {
    const self =
    {
      path: "blah",
      queryValue: "foo"
    }

    const result = await processSchema.call(self, require('./fixtures/schema6.json'))

    expect(result.zap).toEqual('/blah?value=foo')
  })

  test('complex objects', async function()
  {
    const self =
    {
      path: "blah",
      query:
      {
        value: "foo"
      }
    }

    const result = await processSchema.call(self, require('./fixtures/schema7.json'))

    expect(result.zap).toEqual('/blah?value=foo')
  })
})
