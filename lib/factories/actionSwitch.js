import React from 'react'
import t from 'tcomb-form-native/lib'
import styled from 'styled-components/native'

const { Component } = t.form

const ChipsContainer = styled.View`
  margin: auto;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 12px;
`

const Chip = styled.TouchableOpacity`
  background-color: ${({ selected }) => selected && '#4caf50' || '#c0c0c0'};
  border-radius: 10px;
  margin-right: 5px;
  margin-top: 5px;
  padding: 8px;
  ${({ maxWidth }) => maxWidth && `max-width: ${maxWidth}`}
`

const Text = styled.Text`
  color: white;
  font-size: 12px;
  font-weight: bold;
`

export default class ActionSwitch extends Component {

  _onPress = (k) => {
    const { options, ctx } = this.props
    const { actions, selected, onPress } = options
    if (actions[k].make_editable) {
      actions[k].make_editable.forEach((field) => {
        onPress(field, {editable: true})
      })
    }
    if (actions[k].show) {
      actions[k].show.forEach((field) => {
        onPress(field, {hidden: false})
      })
    }
    options.selected = k
    onPress(ctx.path[0], options)
  }

  renderChips() {
    const { options, ctx } = this.props
    const { actions, selected, onPress } = options
    components = []
    Object.keys(actions).forEach((k) => {
      const { label } = actions[k]
      components.push(
        <Chip
          onPress={() => this._onPress(k)}
          selected={selected === k}
        >
          <Text numberOfLines={1}>
            {label || k}
          </Text>
        </Chip>
      )
    })
    return components
  }

  getTemplate() {

    return ({ error, hasError, help, label,
      stylesheet: { chip, chipIcon, container, list, listRow, textbox } }) => {
        return (
          <ChipsContainer>
            {this.renderChips()}
          </ChipsContainer>
        )
      }
  }

}

