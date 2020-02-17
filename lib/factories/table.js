import React         from 'react'
import {
  DataTable,
  Portal,
  Dialog,
  Provider,
  Text,
  Button,
}                    from 'react-native-paper'
import t             from 'tcomb-form-native/lib'
import objectPath    from 'object-path'

const { Component } = t.form

class Table extends Component {

  componentDidMount() {
    this.setState(prevState => ({
      ...prevState,
      isModalVisible: false,
      objectList: [],
      objectTitle: '',
    }))
  }

  shouldComponentUpdate(nextState) {
    const { isModalVisible } = this.state
    return nextState.isModalVisible !== isModalVisible
  }

  getTemplate() {

    return ({ hasError, stylesheet: { container }, value = [] }) => {
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
        <Provider>
          {this.renderModal()}
          <DataTable>
            <DataTable.Header>
              {this.renderTitles(titles)}
            </DataTable.Header>
            {this.renderRows(value, titles)}
          </DataTable>
        </Provider>
      )
    }
  }

  renderModal = () => {
    const { isModalVisible, objectList = [], objectTitle } = this.state
    return (
      <Portal>
        <Dialog style={{ alignSelf: 'center' }} visible={isModalVisible} onDismiss={() => this.setState({ isModalVisible: false })} dismissable>
          <Dialog.Title>{objectTitle}</Dialog.Title>
          <Dialog.Content>
            {objectList.map(object => <Text>{object}</Text>)}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => this.setState({ isModalVisible: false })}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    )
  }


  formatTitles = (title) => {
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

  generateCellWithMultipleRelations = (value, title) => {
    const result = []
    const objName = title.split('[')[0]
    const valueName = title.substring(
      title.indexOf('[') + 1,
      title.indexOf(']'),
    )
    value[objName].forEach((object) => {
      result.push(objectPath.get(object, valueName))
    })
    return (
      result.length === 0
        ?
          <DataTable.Cell>-</DataTable.Cell>
        :
        result.length === 1
          ?
            <DataTable.Cell>{result}</DataTable.Cell>
          :
            <DataTable.Cell onPress={() => this.setState({ isModalVisible: true, objectList: result, objectTitle: `${valueName}(${objName})` })}>{result.length}</DataTable.Cell>
    )
  }

  renderTitles = titles => titles.map(title => <DataTable.Title>{this.formatTitles(title)}</DataTable.Title>)

  renderRows = (rows, titles) => {
    const rowsArray = []
    rows.forEach((row) => {
      rowsArray.push(
        <DataTable.Row>
          {titles.map(title => (title.includes('.') ? <DataTable.Cell>{objectPath.get(row, title)}</DataTable.Cell> : (title.includes('[') ? this.generateCellWithMultipleRelations(row, title) : <DataTable.Cell>{row[title]}</DataTable.Cell>)))}
        </DataTable.Row>,
      )
    })
    return rowsArray
  }

}

export default Table
