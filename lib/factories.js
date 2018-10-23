import {getPayloadError}                      from 'getpayload'
import objectToFormData                       from 'object-to-formdata'
import React                                  from 'react'
import {Button, Text, View, TouchableOpacity} from 'react-native'
import DocumentPicker                         from 'react-native-document-picker'
import FitImage                               from 'react-native-fit-image'
import {Chip, Selectize}                      from 'react-native-material-selectize'
import {TextField}                            from 'react-native-material-textfield'
import t                                      from 'tcomb-form-native/lib'
import { createApolloFetch }                  from 'apollo-fetch'

import {undefinedTransformer} from './transformers'

const {Component} = t.form

class Chips extends Component
{
  _onChange = () => setImmediate(() => this.onChange(this._selectize.getSelectedItems().result))

  getTemplate()
  {
    const {baseColor, errorColor, itemId, items, keyboardType, renderChip,
      renderRow, showItems, trimOnSubmit} = this.props.options

    return ({error, hasError, help, label,
      stylesheet: {chip, chipIcon, container, list, listRow, textbox}}) =>
    {
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
          onBlur: () => this._selectize.submit(),
          onSubmitEditing: this._onChange,
          placeholder: help
        }}/>
    }
  }
}

class Files extends Component
{
  shouldComponentUpdate(nextProps, nextState)
  {
    return super.shouldComponentUpdate(nextProps, nextState)
        || nextState.error2 !== this.state.error2
  }

  _onPress = () =>
  {
    this.setState({error2: undefined})

    const type = this.props.options.type || DocumentPicker.types.allFiles

    DocumentPicker.pickMultiple({type})
    .then(this.onChange.bind(this), error2 =>
    {
      if(error2.code === 'DOCUMENT_PICKER_CANCELED') this.onChange()

      this.setState({error2})
    })
  }

  getTemplate()
  {
    const {disabled, style} = this.props.options
    const {error2: {message} = {}} = this.state

    return ({error, hasError, help, label,
      stylesheet: {button: {backgroundColor}, formGroup}, value = []}) =>
    (
      <View style={[
        hasError ? formGroup.error : formGroup.normal,
        {flexDirection: 'row'},
        style
      ]}>
        <View style={{marginRight: 10}}>
          <Button accessibilityLabel={help} color={backgroundColor}
            disabled={disabled} title={label} onPress={this._onPress}/>
        </View>
        <View style={{flexGrow: 1}}>
          <TouchableOpacity onPress={this._onPress}>
            <TextField disabled={disabled} editable={false}
              error={hasError ? error : message} label='' labelHeight={0}
              tintColor={backgroundColor} title={help}
              value={value.map(({name}) => name).join(', ')}/>
          </TouchableOpacity>
        </View>
      </View>
    )
  }
}
Files.transformer =
{
  format(value)
  {
    return value || []
  },

  parse(files)
  {
    return files || []
  }
}

class FilesSanitizied extends Files
{
  getValue()
  {
    this.setState({error2: undefined})

    try
    {
      return super.getValue()
    }
    catch(e)
    {
      this.setState({error2: new Error('File names can only have ASCII chars')})
    }
  }
}
FilesSanitizied.transformer =
{
  format: Files.transformer.format,

  parse(files)
  {
    files = Files.transformer.parse(files)

    return Array.prototype.map.call(files, function(file)
    {
      return {...file, name: encodeURIComponent(file.name)}
    })
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
    return super.shouldComponentUpdate(nextProps, nextState)
        || nextState.inFlight !== this.state.inFlight
  }

  _onPress = () =>
  {
    const {
      contentType = "multipart/form-data",
      form,
      form: {props: {options: {onSubmit}}},
      meta,
      uri
    } = this.props.options

    const {headers = {}, store = {}} = meta

    let body = form.getValue()
    if(body === null)
      return onSubmit('Form validation failed')

    if(!uri) {
      return onSubmit({...store}, null)
    }

    if(meta.graphql){
      // Implements recursive object serialization according to JSON spec but without quotes around the keys.
      function stringify(obj_from_json){
        if(typeof obj_from_json !== "object" || Array.isArray(obj_from_json)){
          // not an object, stringify using native function
          return JSON.stringify(obj_from_json);
        }
        let props = Object
          .keys(obj_from_json)
          .map(key => `${key}:${stringify(obj_from_json[key])}`)
          .join(",");
        return `${props}`;
      }

      body = JSON.stringify(body, (key, value) => value === null ? '': value)
      body_json = JSON.parse(body)
      body_query = stringify(body_json)

      const apolloFetch = createApolloFetch({uri})

      apolloFetch.useAfter(function({ response }, next) {
        if (response.parsed.errors) {
          throw response.parsed.errors[0]
        }
        next()
      });
      if (meta.graphql.method) {
        const response_fields = meta.graphql.response_fields ? meta.graphql.response_fields.join(" ") : "_id"
        const mutation = `mutation { response: ${meta.graphql.method}(${body_query}) {${response_fields}} }`

        this.setState({inFlight: true})
        apolloFetch({ query: mutation })
          .then(resp => onSubmit({...resp.data, ...store}, null), error => onSubmit(null, error))
          .then(() => this._isMounted && this.setState({inFlight: false}));
      }
      else {
        const mutation = `mutation { ${meta.graphql}(${body_query}) {response message} }`

        this.setState({inFlight: true})
        apolloFetch({ query: mutation })
          .then(resp => onSubmit({...resp.data[meta.graphql], ...store}, null), error => onSubmit(null, error))
          .then(() => this._isMounted && this.setState({inFlight: false}));
      }
    } else {

      if(contentType === "application/json")
        body = JSON.stringify(body, (key, value) => value === null ? '': value)
      else
        body = objectToFormData(body)

      this.setState({inFlight: true})

      fetch(uri, {
        method: "POST",
        headers,
        body
      })
      .then(getPayloadError)
      .then(resp => onSubmit({...resp, ...store}, null), error => onSubmit(null,error))
      .then(() => this._isMounted && this.setState({inFlight: false}))
    }
  }
  getTemplate()
  {
    const {disabled, style} = this.props.options

    return ({
      error, hasError, help, label,
      stylesheet: {
        button: {backgroundColor},
        errorBlock,
        formGroup: {normal: formGroupStyle},
        helpBlock: {normal: helpBlockStyle}
      }
    }) => (
      <View style={[formGroupStyle, style]}>
        <View>
          <Button accessibilityLabel={help} color={backgroundColor}
            disabled={disabled || this.state.inFlight} title={label}
            onPress={this._onPress}/>
          {help ? <Text style={helpBlockStyle}>{help}</Text> : null}
          {hasError ? (
            <Text accessibilityLiveRegion="polite" style={errorBlock}>
              {error}
            </Text>
          ) : null}
        </View>
      </View>
    )
  }
}
Submit.transformer = undefinedTransformer


// ReactNative `FormData` has a non-standard `getParts()` method
const needsSanitizied = typeof FormData.prototype.getParts !== 'undefined'

exports.Chips  = Chips
exports.Files  = needsSanitizied ? FilesSanitizied : Files
exports.Image  = Image
exports.Submit = Submit
