import React                                  from 'react'
import { DataTable }                          from 'react-native-paper'
import t                                      from 'tcomb-form-native/lib'

const { Component } = t.form

class Table extends Component {

  getTemplate() {
    const { baseColor, errorColor, itemId, items, keyboardType, renderChip, //eslint-disable-line
      renderRow, showItems, trimOnSubmit } = this.props.options //eslint-disable-line


    return ({ error, hasError, help, label, //eslint-disable-line
      stylesheet: { chip, chipIcon, container, list, listRow, textbox }, value = [] }) => { //eslint-disable-line
      let containerStyle = container && container.normal //eslint-disable-line
      let titles = []

      if (value.length > 0) {
        titles = Object.keys(value[0])
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

  renderTitles = titles => titles.map(title => <DataTable.Title>{title}</DataTable.Title>)
  renderRows = (rows, titles) => {
    return rows.map(row => {
      console.log(row)
      return (
        <DataTable.Row>
          {this.renderRow(row, titles)}
        </DataTable.Row>
      )
    })
  }

  renderRow = (row, titles) => titles.map(title => <DataTable.Cell>{row[title]}</DataTable.Cell>)

  // _onChange = () => setImmediate(() => this.onChange(this._selectize.getSelectedItems().result))

}

export default Table
