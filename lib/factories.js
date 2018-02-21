import objectToFormData     from 'object-to-formdata'
import React                from 'react'
import {Button, Text, View} from 'react-native'
import DocumentPicker       from 'react-native-document-picker'
import FitImage             from 'react-native-fit-image'
import {Chip, Selectize}    from 'react-native-material-selectize'
import {TextField}          from 'react-native-material-textfield'
import t                    from 'tcomb-form-native/lib'

import {undefinedTransformer} from './transformers'
import {getPayloadError}      from './util'

const {Component} = t.form


class Chips extends Component
{
  _onChange = () => setImmediate(() => this.onChange(this._selectize.getSelectedItems().result))

  getTemplate()
  {
    const {baseColor, errorColor, itemId, items, keyboardType, renderChip,
      renderRow, showItems, trimOnSubmit} = this.props.options

    return ({error, hasError, help, label, stylesheet}) =>
    {
      const {chip, chipIcon, container, list, listRow, textbox} = stylesheet

      let chipIconStyle = chipIcon && chipIcon.normal
      let chipStyle = chip && chip.normal
      let containerStyle = container && container.normal
      let listRowStyle = listRow && listRow.normal
      let listStyle = list && list.normal
      var textboxStyle = textbox && textbox.normal;

      if(hasError)
      {
        chipIconStyle = chipIcon && chipIcon.error
        chipStyle = chip && chip.error
        containerStyle = container && container.error
        listRowStyle = listRow && listRow.error
        listStyle = list && list.error
        textboxStyle = textbox && textbox.error;
      }

      return <Selectize
        ref={c => this._selectize = c}
        autoReflow={false} baseColor={baseColor} chipIconStyle={chipIconStyle}
        chipStyle={chipStyle} containerStyle={containerStyle} error={error}
        errorColor={errorColor} itemId={itemId} items={items} label={label}
        listRowStyle={listRowStyle} listStyle={listStyle}
        renderChip={renderChip} renderRow={renderRow} showItems={showItems}
        tintColor={textboxStyle.borderColor} trimOnSubmit={trimOnSubmit}
        renderChip={(id, onClose, item, style, iconStyle) => (
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
          onSubmitEditing: this._onChange,
          placeholder: help
        }}/>
    }
  }
}

class Files extends Component
{
  _onPress = () =>
  {
    this.setState({error2: undefined})

    const type = this.props.options.type || DocumentPicker.types.allFiles

    DocumentPicker.pickMultiple({type})
    .then(files => this.onChange(files), error2 =>
    {
      if(error2 === 'DOCUMENT_PICKER_CANCELED') return this.onChange()

      this.setState({error2})
    })
  }

  getTemplate()
  {
    const {disabled, style} = this.props.options
    const {error2} = this.state

    return ({error, hasError, help, label, stylesheet, value}) =>
    {
      const {button: {backgroundColor}, formGroup} = stylesheet

      let formGroupStyle = hasError ? formGroup.error : formGroup.normal

      value = value ? value.map(file => file.name).join(', ') : ''

      return (
        <View style={[formGroupStyle, {flexDirection: 'row', width: '60%'}, style]}>
          <View style={{marginRight: 10, flex: 0.3}}>
            <Button accessibilityLabel={help} color={backgroundColor}
              disabled={disabled} title={label} onPress={this._onPress}/>
          </View>
          <View style={{flex: 0.7}}>
            <TextField disabled={disabled} editable={false}
              error={hasError ? error : error2} label='' labelHeight={0}
              tintColor={backgroundColor} title={help} value={value}/>
          </View>
        </View>
      )
    }
  }
}

class Image extends Component
{
  getTemplate()
  {
    const {style, uri} = this.props.options

    return function({label, stylesheet: {image}})
    {
      return (
        <View style={[style, {alignSelf: 'center'}]}>
          <FitImage accessibilityLabel={label} source={{uri}}
            style={image}/>
        </View>
      )
    }
  }
}
Image.transformer = undefinedTransformer

class Submit extends Component
{
  componentDidMount()
  {
    this._isMounted = true
  }

  componentWillUnmount()
  {
    this._isMounted = false
  }

  shouldComponentUpdate(nextProps, nextState)
  {
    const {error2, inFlight} = this.state

    return super.shouldComponentUpdate(nextProps, nextState)
        || nextState.error2 !== error2 || nextState.inFlight !== inFlight
  }

  _onPress = () =>
  {
    const {options} = this.props
    const {form, uri} = options
    const {onSubmit} = form.props.options

    const contentType = options.contentType || "multipart/form-data"

    this.setState({error2: undefined})

    let body = form.getValue()
    if(body === null)
      return this.setState({error2: 'Form validation failed'})

    this.setState({inFlight: true})

    if(contentType === "application/json")
      body = JSON.stringify(body)
    else
      body = objectToFormData(body)

    fetch(uri, {
      method: "POST",
      headers: {"Content-Type": contentType},
      body
    })
    .then(getPayloadError)
    .then(onSubmit, error2 => this.setState({error2}))
    .then(() => this._isMounted && this.setState({inFlight: false}))
  }

  getTemplate()
  {
    const {disabled, style} = this.props.options
    const {error2, inFlight} = this.state

    return ({error, hasError, help, label, stylesheet}) =>
    {
      // TODO fill `help` local someway (if needed)

      const {backgroundColor} = stylesheet.button

      let formGroupStyle  = stylesheet.formGroup.normal
      let helpBlockStyle  = stylesheet.helpBlock.normal
      let errorBlockStyle = stylesheet.errorBlock

      error = hasError ? error : error2

      return (
        <View style={[formGroupStyle, style]}>
          <Button accessibilityLabel={help} color={backgroundColor}
            disabled={disabled || inFlight} title={label}
            onPress={this._onPress}/>
          {help ? <Text style={helpBlockStyle}>{help}</Text> : null}
          {error ? (
            <Text accessibilityLiveRegion="polite" style={errorBlockStyle}>
              {error}
            </Text>
          ) : null}
        </View>
      )
    }
  }
}
Submit.transformer = undefinedTransformer


exports.Chips  = Chips
exports.Files  = Files
exports.Image  = Image
exports.Submit = Submit
