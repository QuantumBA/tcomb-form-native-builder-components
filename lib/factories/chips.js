import React                                  from 'react'
import { Chip, Selectize }                      from 'react-native-material-selectize'
import t                                      from 'tcomb-form-native/lib'

const { Component } = t.form

class Chips extends Component {

  getTemplate() {
    const { baseColor, errorColor, itemId, items, keyboardType, renderChip,
      renderRow, showItems, trimOnSubmit } = this.props.options //eslint-disable-line


    return ({ error, hasError, help, label,
      stylesheet: { chip, chipIcon, container, list, listRow, textbox } }) => {
      let chipIconStyle = chipIcon && chipIcon.normal
      let chipStyle = chip && chip.normal
      let containerStyle = container && container.normal
      let listRowStyle = listRow && listRow.normal
      let listStyle = list && list.normal
      let textboxStyle = textbox && textbox.normal

      if (hasError) {
        chipIconStyle = chipIcon && chipIcon.error
        chipStyle = chip && chip.error
        containerStyle = container && container.error
        listRowStyle = listRow && listRow.error
        listStyle = list && list.error
        textboxStyle = textbox && textbox.error
      }

      return (
        <Selectize
          ref={c => this._selectize = c} //eslint-disable-line
          autoReflow={false}
          baseColor={baseColor}
          chipIconStyle={chipIconStyle}
          chipStyle={chipStyle}
          containerStyle={containerStyle}
          error={error}
          errorColor={errorColor}
          itemId={itemId}
          items={items}
          label={label}
          listRowStyle={listRowStyle}
          listStyle={listStyle}
          renderChip={renderChip}
          renderRow={renderRow}
          showItems={showItems}
          tintColor={textboxStyle.borderColor}
          trimOnSubmit={trimOnSubmit}
          renderChip={(id, onClose, item, style, iconStyle) => ( //eslint-disable-line
            <Chip
              key={id}
              iconStyle={iconStyle}
              onClose={() => {
                this._onChange()
                onClose()
              }}
              text={id}
              style={style}
            />
          )}
          textInputProps={{
            keyboardType,
            onBlur: () => this._selectize.submit(),
            onSubmitEditing: this._onChange,
            placeholder: help,
          }}
        />
      )
    }
  }

  _onChange = () => setImmediate(() => this.onChange(this._selectize.getSelectedItems().result))

}

export default Chips
