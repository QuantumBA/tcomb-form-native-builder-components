import React                                  from 'react'
import { TextField }                          from 'react-native-material-textfield'
import { TouchableOpacity, View, Button }     from 'react-native'
import DocumentPicker                         from 'react-native-document-picker'
import t                                      from 'tcomb-form-native/lib'

const { Component } = t.form

class FilesNotSanitized extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    const { error2 } = this.state

    return super.shouldComponentUpdate(nextProps, nextState)
        || nextState.error2 !== error2
  }

  getTemplate() {
    const { disabled, style } = this.props.options // eslint-disable-line
    const { error2: { message } = {} } = this.state

    return ({ error, hasError, help, label,
      stylesheet: { button: { backgroundColor }, formGroup }, value = [] }) => (
        <View style={[
          hasError ? formGroup.error : formGroup.normal,
          { flexDirection: 'row' },
          style,
        ]}
        >
          <View style={{ marginRight: 10 }}>
            <Button
              accessibilityLabel={help}
              color={backgroundColor}
              disabled={disabled}
              title={label}
              onPress={this._onPress}
            />
          </View>
          <View style={{ flexGrow: 1 }}>
            <TouchableOpacity onPress={this._onPress}>
              <TextField
                disabled={disabled}
                editable={false}
                error={hasError ? error : message}
                label=""
                labelHeight={0}
                tintColor={backgroundColor}
                title={help}
                value={value.map(({ name }) => name).join(', ')}
              />
            </TouchableOpacity>
          </View>
        </View>
    )
  }

  _onPress = () => {
    this.setState({ error2: undefined })

    const type = this.props.options.type || DocumentPicker.types.allFiles // eslint-disable-line

    DocumentPicker.pickMultiple({ type })
      .then(this.onChange.bind(this), (error2) => {
        if (error2.code === 'DOCUMENT_PICKER_CANCELED') this.onChange()

        this.setState({ error2 })
      })
  }

}

FilesNotSanitized.transformer =
{
  format(value) {
    return value || []
  },

  parse(files) {
    return files || []
  },
}

class FilesSanitizied extends FilesNotSanitized {

  getValue() {
    this.setState({ error2: undefined })

    try {
      return super.getValue()
    } catch (e) {
      this.setState({ error2: new Error('File names can only have ASCII chars') })
      return null
    }
  }

}
FilesSanitizied.transformer =
{
  format: FilesNotSanitized.transformer.format,

  parse(files) {
    files = FilesNotSanitized.transformer.parse(files)

    return Array.prototype.map.call(files, file => ({ ...file, name: encodeURIComponent(file.name) }))
  },
}

// ReactNative `FormData` has a non-standard `getParts()` method
const needsSanitizied = typeof FormData.prototype.getParts !== 'undefined'
const Files = needsSanitizied ? FilesSanitizied : FilesNotSanitized

export default Files
