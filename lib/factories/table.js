import React                                  from 'react'
import { DataTable }                          from 'react-native-paper'
import t                                      from 'tcomb-form-native/lib'
import objectPath                             from 'object-path'


const { Component } = t.form

class Table extends Component {

  getTemplate() {

    return ({ hasError, stylesheet: { container }, value = [] }) => { //eslint-disable-line
      let containerStyle = container && container.normal //eslint-disable-line
      let titles = []
      if (value.length > 0) {
        titles = Object.keys(value[0])
        value.forEach((object) => {
          Object.entries(object).forEach(([property, propertyValue]) => {
            if (!Array.isArray(propertyValue) && typeof propertyValue === 'object' && propertyValue !== null) {
              if (titles.indexOf(property) !== -1) titles.splice(titles.indexOf(property), 1)
              Object.keys(propertyValue).forEach((title) => {
                if (!titles.includes(`${property}.${title}`)) titles.push(`${property}.${title}`)
              })
            } else if (Array.isArray(propertyValue)) {
              if (titles.indexOf(property) !== -1) titles.splice(titles.indexOf(property), 1)
              propertyValue.forEach((obj) => {
                Object.keys(obj).forEach((arrayProperty) => {
                  if (!titles.includes(`${property}[${arrayProperty}]`)) titles.push(`${property}[${arrayProperty}]`)
                })
              })
            }
          })
        })
      }

      if (hasError) {
        containerStyle = container && container.error
      }

      return (
        <DataTable>
          <DataTable.Header>
            {this.renderTitles(titles)}
          </DataTable.Header>
          {this.renderRows(value, titles)}
        </DataTable>
      )
    }
  }

  formatTitle = (title) => {
    if (title.indexOf('.') !== -1) {
      const splitted = title.split('.')
      return (`${splitted[1]}(${splitted[0]})`)
    }
    if (title.indexOf('[') !== -1) {
      const newTitle = title.replace('[', '.').replace(']', '')
      const splitted = newTitle.split('.')
      return (`${splitted[1]}(${splitted[0]})`)
    }
    return title
  }

  generateRowsForMultipleRelations = (value, title, titles) => {
    const result = []
    const objName = title.split('[')[0]
    const valueName = title.substring(
      title.indexOf('[') + 1,
      title.indexOf(']'),
    )
    value[objName].forEach((object) => {
      result.push(
        <DataTable.Row>
          {titles.map(newTitle => <DataTable.Cell>{title === newTitle ? objectPath.get(object, valueName) : null}</DataTable.Cell>)}
        </DataTable.Row>
      )
    })
    return result
  }

  renderTitles = titles => titles.map(title => <DataTable.Title>{this.formatTitle(title)}</DataTable.Title>)

  renderRows = (rows, titles) => {
    const rowsArray = []
    rows.forEach((row) => {
      rowsArray.push(
        <DataTable.Row style={{ backgroundColor: 'lightgrey' }}>
          {titles.map(title => <DataTable.Cell>{title.includes('.') ? objectPath.get(row, title) : row[title]}</DataTable.Cell>)}
        </DataTable.Row>
      )
      titles.forEach((currentTitle) => {
        if (currentTitle.includes('[')) {
          rowsArray.push(this.generateRowsForMultipleRelations(row, currentTitle, titles))
        }
      })
    })
    return rowsArray
  }

}

export default Table
